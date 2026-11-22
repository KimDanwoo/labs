export const THINK_MS = 1200;

export const MAX_DEPTH = 14;

export const MAX_PLY = 40;

export const ROOT_WIDTH = 16;

export const INNER_WIDTH = 10;

export const TIME_CHECK_MASK = 1023;

export const WIN_SCORE = 10_000_000;

export const MOVER_EDGE = 1.5;

export const WINDOW_WEIGHT = [0, 1, 8, 60, 500, 0] as const;

export const ATTACK_WEIGHT = [1, 6, 50, 600, 0] as const;

export const DEFEND_WEIGHT = [0, 3, 30, 400, 0] as const;
