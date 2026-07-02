-- ============================================================
-- 공개 방 비밀번호 잠금
--   - 공개 방(is_public)에 선택적 비밀번호를 걸 수 있다: "목록엔 보이되 비번을 아는 사람만 입장"
--   - 비밀번호 해시(bcrypt)는 별도 room_passwords 테이블에 격리한다.
--     · RLS 정책을 두지 않아 authenticated/anon 은 읽지도 쓰지도 못한다.
--     · SECURITY DEFINER RPC(create_room/join_room)만 접근한다 → 해시가 클라이언트로 새지 않는다.
--   - chat_rooms.has_password 불리언만 클라이언트에 노출(자물쇠 표시·입력 프롬프트 판단용).
--   - 비공개(초대 전용) 방은 초대가 이미 관문이므로 비밀번호 대상이 아니다.
-- ============================================================

-- bcrypt 해시용. Supabase 기본 확장 스키마에 설치.
create extension if not exists pgcrypto with schema extensions;

-- 방에 비밀번호가 걸려 있는지 (해시 자체는 노출하지 않고 이 플래그만 노출)
alter table chat_rooms add column if not exists has_password boolean not null default false;

-- 비밀번호 해시 격리 테이블: 클라이언트 직접 접근 불가(정책 없음), RPC만 사용
create table if not exists room_passwords (
  room_id       uuid primary key references chat_rooms(id) on delete cascade,
  password_hash text not null
);
alter table room_passwords enable row level security;
-- (select/insert/update/delete 정책을 의도적으로 두지 않음 → 클라이언트 전면 차단)

-- 방 생성: 비밀번호 인자 추가. 기존 3-인자 시그니처 제거(오버로드 모호성 방지).
drop function if exists create_room(text, text, boolean);
create or replace function create_room(
  p_name text,
  p_nickname text,
  p_is_public boolean default false,
  p_password text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room uuid;
  -- 비공개 방에는 비밀번호가 의미 없으므로 공개 방에만 반영한다.
  v_has_password boolean := p_is_public and p_password is not null and char_length(p_password) > 0;
begin
  if not is_non_anonymous() then
    raise exception 'anonymous users cannot create rooms';
  end if;
  insert into chat_rooms(name, owner_id, is_public, has_password)
    values (p_name, auth.uid(), p_is_public, v_has_password)
    returning id into v_room;
  insert into room_members(room_id, user_id, nickname) values (v_room, auth.uid(), p_nickname);
  if v_has_password then
    insert into room_passwords(room_id, password_hash)
      values (v_room, crypt(p_password, gen_salt('bf')));
  end if;
  return v_room;
end;
$$;

-- 공개 방 입장: 비밀번호 검증 추가. 기존 2-인자 시그니처 제거.
drop function if exists join_room(uuid, text);
create or replace function join_room(
  p_room_id uuid,
  p_nickname text,
  p_password text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_has_password boolean;
  v_stored text;
begin
  if not is_non_anonymous() then
    raise exception 'anonymous users cannot join rooms';
  end if;
  -- 이미 멤버면 비밀번호 없이 통과(재입장)
  if is_room_member(p_room_id, auth.uid()) then
    return p_room_id;
  end if;
  select has_password into v_has_password
    from chat_rooms where id = p_room_id and is_public;
  if v_has_password is null then
    raise exception 'room not found or not public';
  end if;
  if v_has_password then
    select password_hash into v_stored from room_passwords where room_id = p_room_id;
    if v_stored is null or p_password is null or crypt(p_password, v_stored) <> v_stored then
      raise exception 'wrong password';
    end if;
  end if;
  insert into room_members(room_id, user_id, nickname)
    values (p_room_id, auth.uid(), p_nickname)
    on conflict (room_id, user_id) do nothing;
  return p_room_id;
end;
$$;
