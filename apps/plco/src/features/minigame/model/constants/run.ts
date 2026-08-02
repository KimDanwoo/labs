export const RUN_FIELD_WIDTH = 300;
export const RUN_FIELD_HEIGHT = 200;
export const RUN_GROUND_HEIGHT = 28;
export const RUN_CHAR_X = 36;
export const RUN_CHAR_SIZE = 44;
export const RUN_OBSTACLE_SIZE = 30;

// 물리는 60fps 기준값. 실제 프레임 간격(dt)으로 보정해 프레임레이트와 무관하게 동작한다.
export const RUN_FRAME_MS = 1000 / 60;
export const RUN_MAX_FRAME_STEP = 2.5;

// 점프 물리(60fps 기준). 잘 만든 러너처럼 "가변 높이 + 비대칭 중력"을 쓴다.
// - 초기 속도 8.4 / 상승 중력 0.42 → 풀점프 최고점 ~84px, 상승 333ms.
// - 하강 중력 0.62(상승보다 빠름) → 낙하 274ms. 총 체공 ~607ms(기존 857ms보다 경쾌).
// - 장애물은 실질 ~22px만 넘으면 되므로, 넘치던 높이를 줄여 "붕 뜨는" 느낌을 없앤다.
export const RUN_JUMP_VELOCITY = 8.4;
export const RUN_GRAVITY_RISE = 0.42;
export const RUN_GRAVITY_FALL = 0.62;
// 버튼을 떼면 상승 속도를 이 값으로 깎아 짧은 홉을 만든다(가변 점프 높이).
// 5.5 → 즉시 떼면 최고점 ~36px(장애물은 넘고 낮은 하트만), 계속 누르면 풀점프.
export const RUN_JUMP_CUT_VELOCITY = 5.5;
export const RUN_GROUND_EPSILON = 0.01;
export const RUN_JUMP_BUFFER_MS = 120;
// 착지 직전(이 높이 이하)에 누르면 바로 다음 점프가 나가는 여유(coyote-ish 입력 관용).
export const RUN_JUMP_FORGIVE_HEIGHT = 6;

export const RUN_TILT_FACTOR = 2.4;
export const RUN_TILT_MAX = 14;
export const RUN_HITBOX_PADDING = 8;
export const RUN_HEART_HITBOX_PADDING = 3;
export const RUN_MIN_GAP_FACTOR = 4.2;

export const RUN_COUNTDOWN_STEP_MS = 600;
export const RUN_COUNTDOWN_FINISH_MS = 2200;
export const RUN_PICKUP_FLOAT_MS = 700;
export const RUN_CRASH_DURATION_MS = 420;

// 시작 속도를 180px/s(3.0pf)로 높여 "화면 중간에서 점프 → 장애물 넘기" 직관을
// 첫 프레임부터 성립시킨다. 가속 후 cap(4.5pf=270px/s)에서 고정.
export const RUN_OBSTACLE_SPEED_BASE = 3.0;
export const RUN_OBSTACLE_SPEED_ACCEL = 0.00006;
export const RUN_OBSTACLE_SPEED_MAX = 4.5;

export const RUN_SPAWN_INTERVAL_BASE = 1800;
export const RUN_SPAWN_INTERVAL_MIN = 900;
export const RUN_SPAWN_SPEEDUP = 0.015;

export const RUN_OBSTACLE_EMOJIS = ['🌵', '🪨', '🎤'];

export const RUN_HEART_EMOJI = '💖';
export const RUN_HEART_SIZE = 22;
export const RUN_HEART_SPAWN_INTERVAL_BASE = 1500;
export const RUN_HEART_SPAWN_INTERVAL_MIN = 850;
// 하트 높이를 3단계로 고정 → 플레이어가 높이별 점프 타이밍을 학습할 수 있다.
// LOW(45): 살짝 뛰기, MID(68): 반점프, HIGH(90): 풀점프 필요
export const RUN_HEART_Y_TIERS = [45, 68, 90] as const;

export const RUN_SCORE_GOOD = 12;
export const RUN_SCORE_OK = 6;
export const RUN_REWARD_CAP = 30;

export const RUN_BEST_SCORE_KEY = 'plco-run-best-score';

export const RUN_PHASE = {
  READY: 'ready',
  PLAYING: 'playing',
  RESULT: 'result',
} as const;
