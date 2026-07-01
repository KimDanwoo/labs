-- ============================================================
-- 팬 채팅: 캐릭터별 방(room = character_id)
--   - 읽기: 인증된 유저(익명 포함) 누구나 → 톡 구경 후 로그인 유도
--   - 쓰기: 본인 user_id + 비익명(구글 연동) 유저만 (RLS 강제, 클라 우회 불가)
--   - 수정/삭제 정책 없음 → service_role(서버)만 가능
--   - Supabase Realtime 발행으로 실시간 수신
-- ============================================================

create table if not exists chat_messages (
  id           uuid primary key default gen_random_uuid(),
  character_id text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  nickname     text not null check (char_length(nickname) between 1 and 40),
  message      text not null check (char_length(message) between 1 and 200),
  created_at   timestamptz not null default now()
);

-- 방별 최신순 조회 인덱스
create index if not exists chat_messages_room_idx
  on chat_messages(character_id, created_at desc);

alter table chat_messages enable row level security;

-- 읽기: 인증된 유저면 누구나 (익명 포함)
drop policy if exists "chat read" on chat_messages;
create policy "chat read"
  on chat_messages for select
  to authenticated
  using (true);

-- 쓰기: 본인 user_id 이고, 익명이 아닌(구글 연동) 유저만
drop policy if exists "chat insert" on chat_messages;
create policy "chat insert"
  on chat_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- Realtime 발행 (재실행 안전하게 가드)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
end $$;
