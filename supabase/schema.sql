-- ============================
-- 플레이브 다마고치 DB 스키마
-- Supabase SQL Editor에서 실행
-- ============================

-- 유저 프로필 (Supabase Auth 연동)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now()
);

-- 게임 세이브 데이터
create table if not exists game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  character_id text not null,
  nickname text not null default '',
  status text not null default 'playing',
  level int not null default 1,
  exp int not null default 0,
  hunger real not null default 80,
  cleanliness real not null default 100,
  hearts real not null default 0,
  coins int not null default 50,
  poops jsonb not null default '[]',
  inventory jsonb not null default '{"bread":3,"riceball":1,"meat":0,"cake":0}',
  pending_poops jsonb not null default '[]',
  is_sleeping boolean not null default false,
  woke_up_at bigint,
  is_sick boolean not null default false,
  sick_since bigint,
  hunger_zero_since bigint,
  cleanliness_zero_since bigint,
  unlocked_characters jsonb not null default '[]',
  egg_ready_character_id text,
  level_up_message text,
  last_updated bigint not null default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id) -- 유저당 세이브 1개
);

-- 출석 기록
create table if not exists daily_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  login_date date not null default current_date,
  streak int not null default 1,
  reward_coins int not null default 0,
  reward_food jsonb,
  created_at timestamptz default now(),

  unique(user_id, login_date)
);

-- 도감 (캐릭터 달성 기록)
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  character_id text not null,
  max_level int not null default 1,
  total_feeds int not null default 0,
  total_cleans int not null default 0,
  total_meetings int not null default 0,
  total_minigames int not null default 0,
  times_raised int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, character_id)
);

-- RLS (Row Level Security) 활성화
alter table profiles enable row level security;
alter table game_saves enable row level security;
alter table daily_logins enable row level security;
alter table achievements enable row level security;

-- RLS 정책: 본인 데이터만 접근
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can view own saves"
  on game_saves for select using (auth.uid() = user_id);

create policy "Users can manage own saves"
  on game_saves for all using (auth.uid() = user_id);

create policy "Users can view own logins"
  on daily_logins for select using (auth.uid() = user_id);

create policy "Users can manage own logins"
  on daily_logins for all using (auth.uid() = user_id);

create policy "Users can view own achievements"
  on achievements for select using (auth.uid() = user_id);

create policy "Users can manage own achievements"
  on achievements for all using (auth.uid() = user_id);

-- 프로필 자동 생성 트리거 (회원가입 시)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger game_saves_updated
  before update on game_saves
  for each row execute function update_updated_at();

create or replace trigger achievements_updated
  before update on achievements
  for each row execute function update_updated_at();
