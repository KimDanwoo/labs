-- ============================================================
-- 초대 기반 채팅방
--   - 방(chat_rooms) + 멤버십(room_members) + 초대(room_invites)
--   - 메시지는 방 단위(room_id): 멤버만 읽기, 비익명 본인만 쓰기 (RLS 강제)
--   - 초대: 방 멤버가 보내고, 받은 본인만 수락/거절
--   - 방 생성/초대 수락은 트랜잭션 RPC(SECURITY DEFINER)로 멤버십까지 원자적 처리
--   - Supabase Realtime로 메시지·초대 실시간 수신
--   - 기존 캐릭터별 팬채팅(character_id 기반 chat_messages) 폐기 → 방 기반으로 교체
-- ============================================================

-- 기존 캐릭터 채팅 폐기 (정책·publication 포함 cascade)
drop table if exists chat_messages cascade;

-- 방
create table if not exists chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 멤버십 (내 방 목록의 근거)
create table if not exists room_members (
  room_id   uuid not null references chat_rooms(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  nickname  text not null check (char_length(nickname) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists room_members_user_idx on room_members(user_id);

-- 초대
create table if not exists room_invites (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references chat_rooms(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (room_id, invitee_id)
);
create index if not exists room_invites_invitee_idx on room_invites(invitee_id, status);

-- 메시지 (방 단위)
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references chat_rooms(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 40),
  message    text not null check (char_length(message) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_room_idx on chat_messages(room_id, created_at desc);
alter table chat_messages replica identity full;

-- 멤버십 체크: RLS에서 room_members를 다시 조회할 때 재귀를 피하려고 SECURITY DEFINER 사용
create or replace function is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from room_members where room_id = p_room_id and user_id = p_user_id
  );
$$;

-- 비익명(구글 연동) 유저인지
create or replace function is_non_anonymous()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

alter table chat_rooms enable row level security;
alter table room_members enable row level security;
alter table room_invites enable row level security;
alter table chat_messages enable row level security;

-- chat_rooms: 멤버만 조회, 비익명 본인이 생성
drop policy if exists "room select" on chat_rooms;
create policy "room select" on chat_rooms for select to authenticated
  using (is_room_member(id, auth.uid()));

drop policy if exists "room insert" on chat_rooms;
create policy "room insert" on chat_rooms for insert to authenticated
  with check (owner_id = auth.uid() and is_non_anonymous());

-- room_members: 같은 방 멤버끼리 조회 (등록은 RPC로만)
drop policy if exists "member select" on room_members;
create policy "member select" on room_members for select to authenticated
  using (is_room_member(room_id, auth.uid()));

-- room_invites: 내가 주고받은 초대만 조회 / 방 멤버가 발송 / 받은 본인이 상태 변경
drop policy if exists "invite select" on room_invites;
create policy "invite select" on room_invites for select to authenticated
  using (invitee_id = auth.uid() or inviter_id = auth.uid());

drop policy if exists "invite insert" on room_invites;
create policy "invite insert" on room_invites for insert to authenticated
  with check (
    inviter_id = auth.uid()
    and is_room_member(room_id, auth.uid())
    and is_non_anonymous()
  );

drop policy if exists "invite update" on room_invites;
create policy "invite update" on room_invites for update to authenticated
  using (invitee_id = auth.uid() and status = 'pending')
  with check (status = 'declined');

-- chat_messages: 멤버만 조회 / 비익명 본인만 작성
drop policy if exists "message select" on chat_messages;
create policy "message select" on chat_messages for select to authenticated
  using (is_room_member(room_id, auth.uid()));

drop policy if exists "message insert" on chat_messages;
create policy "message insert" on chat_messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_room_member(room_id, auth.uid())
    and is_non_anonymous()
  );

-- 방 생성 + 소유자 멤버 등록 (원자적)
create or replace function create_room(p_name text, p_nickname text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room uuid;
begin
  if not is_non_anonymous() then
    raise exception 'anonymous users cannot create rooms';
  end if;
  insert into chat_rooms(name, owner_id) values (p_name, auth.uid()) returning id into v_room;
  insert into room_members(room_id, user_id, nickname) values (v_room, auth.uid(), p_nickname);
  return v_room;
end;
$$;

-- 초대 수락: 상태 변경 + 멤버 등록 (본인 pending 초대만, 원자적)
create or replace function accept_invite(p_invite_id uuid, p_nickname text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room uuid;
begin
  if not is_non_anonymous() then
    raise exception 'anonymous users cannot accept invites';
  end if;
  update room_invites set status = 'accepted'
    where id = p_invite_id and invitee_id = auth.uid() and status = 'pending'
    returning room_id into v_room;
  if v_room is null then
    raise exception 'invite not found or not pending';
  end if;
  insert into room_members(room_id, user_id, nickname)
    values (v_room, auth.uid(), p_nickname)
    on conflict (room_id, user_id) do nothing;
  return v_room;
end;
$$;

-- Realtime 발행 (메시지 + 초대). 재실행 안전 가드.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'room_invites'
  ) then
    alter publication supabase_realtime add table room_invites;
  end if;
end $$;
