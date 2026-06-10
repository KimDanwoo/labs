export const RUN_FIELD_WIDTH = 300;
export const RUN_FIELD_HEIGHT = 200;
export const RUN_GROUND_HEIGHT = 28;
export const RUN_CHAR_X = 36;
export const RUN_CHAR_SIZE = 44;
export const RUN_OBSTACLE_SIZE = 30;

// 물리는 60fps 기준값. 실제 프레임 간격(dt)으로 보정해 프레임레이트와 무관하게 동작한다.
export const RUN_FRAME_MS = 1000 / 60;
export const RUN_MAX_FRAME_STEP = 2.5;

export const RUN_JUMP_VELOCITY = 9;
// gravity 0.35: 체공 850ms, 최고점 111px. 장애물 접근 시간(848ms)보다 짧아
// "뛰면 넘는다"는 직관이 속도와 일치한다.
export const RUN_GRAVITY = 0.35;
export const RUN_GROUND_EPSILON = 0.01;
export const RUN_JUMP_BUFFER_MS = 120;

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
