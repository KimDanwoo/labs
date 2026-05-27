-- game_saves를 state jsonb 단일 컬럼 구조로 통합
--
-- 기존 컬럼별 데이터는 이관하지 않습니다.
-- 클라이언트의 localStorage가 최신 state를 가지고 있고, 게임 접속 시 즉시
-- 새 state jsonb 컬럼으로 다시 저장됩니다.
-- (서버에만 있고 localStorage에는 없는 진행 데이터는 손실됩니다 — dev 환경에서는 무해)

-- 1) state 컬럼 보장 (기본값 '{}', NOT NULL)
alter table game_saves
  add column if not exists state jsonb not null default '{}'::jsonb;

-- 2) 기존 개별 컬럼 모두 제거 (있는 것만)
alter table game_saves
  drop column if exists character_id,
  drop column if exists nickname,
  drop column if exists status,
  drop column if exists level,
  drop column if exists exp,
  drop column if exists hunger,
  drop column if exists cleanliness,
  drop column if exists hearts,
  drop column if exists coins,
  drop column if exists poops,
  drop column if exists inventory,
  drop column if exists pending_poops,
  drop column if exists is_sleeping,
  drop column if exists woke_up_at,
  drop column if exists is_sick,
  drop column if exists sick_since,
  drop column if exists hunger_zero_since,
  drop column if exists cleanliness_zero_since,
  drop column if exists unlocked_characters,
  drop column if exists egg_ready_character_id,
  drop column if exists level_up_message,
  drop column if exists feeding_message,
  drop column if exists last_meeting_at,
  drop column if exists meetings_today,
  drop column if exists meeting_day;
