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
export const RUN_GRAVITY = 0.34;
export const RUN_GROUND_EPSILON = 0.01;

export const RUN_TILT_FACTOR = 2.4;
export const RUN_TILT_MAX = 14;
export const RUN_HITBOX_PADDING = 8;
export const RUN_MIN_GAP_FACTOR = 4.2;

export const RUN_COUNTDOWN_STEP_MS = 600;
export const RUN_COUNTDOWN_FINISH_MS = 2200;
export const RUN_PICKUP_FLOAT_MS = 700;
export const RUN_CRASH_DURATION_MS = 420;

export const RUN_OBSTACLE_SPEED_BASE = 1.7;
export const RUN_OBSTACLE_SPEED_ACCEL = 0.0002;

export const RUN_SPAWN_INTERVAL_BASE = 2400;
export const RUN_SPAWN_INTERVAL_MIN = 1100;
export const RUN_SPAWN_SPEEDUP = 0.015;

export const RUN_OBSTACLE_EMOJIS = ['🌵', '🪨', '🎤'];

export const RUN_HEART_EMOJI = '💖';
export const RUN_HEART_SIZE = 22;
export const RUN_HEART_SPAWN_INTERVAL_BASE = 1800;
export const RUN_HEART_SPAWN_INTERVAL_MIN = 1100;
export const RUN_HEART_Y_MIN = 36;
export const RUN_HEART_Y_MAX = 72;

export const RUN_SCORE_GOOD = 12;
export const RUN_SCORE_OK = 6;
export const RUN_REWARD_CAP = 30;

export const RUN_BEST_SCORE_KEY = 'plco-run-best-score';

export const RUN_PHASE = {
  READY: 'ready',
  PLAYING: 'playing',
  RESULT: 'result',
} as const;
