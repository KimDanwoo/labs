-- ============================================================
-- 관리자 편집용 콘텐츠 테이블: 만남 대사 + 캐릭터(표시값)
-- 패턴: quiz_questions 와 동일
--   - is_active / sort_order
--   - 공개 읽기(anon, authenticated) RLS
--   - 쓰기는 RLS 정책 없음 → service_role(서버)만 가능
-- 시드는 scripts/seed-content.ts 에서 기존 상수를 읽어 upsert
-- ============================================================

-- updated_at 갱신 함수 (schema.sql 에 이미 있지만 마이그레이션 단독 실행 대비)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── 관리자 역할 ──────────────────────────────────────────────
-- profiles 에 is_admin 플래그 추가. 관리자 페이지는 이 값이 true 인
-- Supabase Auth 유저만 접근 가능. 서버에서 service_role 로 확인한다.
alter table profiles add column if not exists is_admin boolean not null default false;

-- 관리자 지정 방법 (대시보드에서 이메일/비번 유저 생성 후 실행):
--   update profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');

-- ── 만남 대사 ────────────────────────────────────────────────
create table if not exists meeting_scenes (
  id           text primary key,
  character_id text not null,
  category     text not null,
  prompt       text not null,
  options      jsonb not null, -- [{ text, outcome, reaction }]
  is_active    boolean not null default true,
  sort_order   int default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists meeting_scenes_character_idx
  on meeting_scenes(character_id)
  where is_active;

alter table meeting_scenes enable row level security;

drop policy if exists "meeting_scenes read" on meeting_scenes;
create policy "meeting_scenes read"
  on meeting_scenes
  for select
  to anon, authenticated
  using (is_active);

drop trigger if exists meeting_scenes_updated on meeting_scenes;
create trigger meeting_scenes_updated
  before update on meeting_scenes
  for each row execute function update_updated_at();

-- ── 캐릭터(표시값) ───────────────────────────────────────────
-- id 와 스프라이트 매핑은 타입 안전을 위해 코드에 유지.
-- 여기서는 표시용 텍스트/색/이모지만 관리한다.
create table if not exists characters (
  id            text primary key,
  name          text not null,
  color         text not null,
  bg_color      text not null,
  border_color  text not null,
  emoji         text not null,
  is_active     boolean not null default true,
  sort_order    int default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table characters enable row level security;

drop policy if exists "characters read" on characters;
create policy "characters read"
  on characters
  for select
  to anon, authenticated
  using (is_active);

drop trigger if exists characters_updated on characters;
create trigger characters_updated
  before update on characters
  for each row execute function update_updated_at();
