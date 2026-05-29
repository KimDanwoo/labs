export const RUN_FIELD_WIDTH = 300;
export const RUN_FIELD_HEIGHT = 180;
export const RUN_GROUND_HEIGHT = 28;
export const RUN_CHAR_X = 36;
export const RUN_CHAR_SIZE = 44;
export const RUN_OBSTACLE_SIZE = 30;

export const RUN_JUMP_VELOCITY = 8.4;
export const RUN_GRAVITY = 0.42;

export const RUN_OBSTACLE_SPEED_BASE = 1.8;
export const RUN_OBSTACLE_SPEED_ACCEL = 0.00028;

export const RUN_SPAWN_INTERVAL_BASE = 2400;
export const RUN_SPAWN_INTERVAL_MIN = 900;
export const RUN_SPAWN_SPEEDUP = 0.02;

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
