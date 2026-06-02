export const MINIGAME_GOOD_EMOJIS = ['💖', '⭐', '🌟', '💕', '🎵'];
export const MINIGAME_BAD_EMOJIS = ['💣', '💀'];
export const MINIGAME_BAD_SPAWN_RATE = 0.22;
export const MINIGAME_BAD_PENALTY = 1;
export const MINIGAME_FLOAT_MS = 600;
export const MINIGAME_COMBO_SHOW_THRESHOLD = 2;
export const MINIGAME_DURATION = 15_000;
export const MINIGAME_FIELD_WIDTH = 280;
export const MINIGAME_FIELD_HEIGHT = 340;
export const MINIGAME_CATCHER_WIDTH = 50;
export const MINIGAME_CATCHER_HEIGHT = 36;
export const MINIGAME_CATCHER_BOTTOM = 8;
export const MINIGAME_CATCHER_EMOJI_SIZE = 28;
export const MINIGAME_ITEM_SIZE = 28;
export const MINIGAME_ITEM_DESPAWN_MARGIN = 10;
export const MINIGAME_CATCHER_SPEED = 8;
export const MINIGAME_SPAWN_INTERVAL_BASE = 700;
export const MINIGAME_SPAWN_INTERVAL_MIN = 400;
export const MINIGAME_SPAWN_SPEEDUP = 0.02;
export const MINIGAME_ITEM_SPEED_BASE = 2;
export const MINIGAME_ITEM_SPEED_RANDOM = 1.5;
export const MINIGAME_ITEM_SPEED_ACCEL = 0.0003;
export const MINIGAME_SCORE_GOOD = 15;
export const MINIGAME_SCORE_OK = 8;

export const MINIGAME_PHASE = {
  READY: 'ready',
  PLAYING: 'playing',
  RESULT: 'result',
} as const;

export const MINIGAME_MODE = {
  SELECT: 'select',
  CATCH: 'catch',
  RUN: 'run',
  QUIZ: 'quiz',
} as const;
