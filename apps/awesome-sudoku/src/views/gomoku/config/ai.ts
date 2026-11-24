export const THINK_MS = 2500;

export const MAX_DEPTH = 20;

export const MAX_PLY = 100;

export const UI_THINK_MS = 32;

export const ROOT_WIDTH = 24;

export const INNER_WIDTH = 12;

export const MAX_TABLE_ENTRIES = 50_000;

export const FORCING_DEPTH = MAX_PLY / 2;

export const FORCING_BUDGET_RATIO = 0.3;

export const FORCING_BUDGET_MS = 500;

export const SEARCH_BOUND = { EXACT: 'exact', LOWER: 'lower', UPPER: 'upper' } as const;

export const WIN_SCORE = 10_000_000;

export const MOVER_EDGE = 1.5;

export const WINDOW_WEIGHT = [0, 1, 8, 60, 500, 0] as const;

export const ATTACK_WEIGHT = [1, 6, 50, 600, 0] as const;

export const DEFEND_WEIGHT = [0, 3, 30, 400, 0] as const;
