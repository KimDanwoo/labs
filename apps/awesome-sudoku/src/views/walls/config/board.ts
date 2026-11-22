export const BOARD_SIZE = 7;

export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export const EDGE_COUNT = CELL_COUNT * 2;

export const STEP_MAX = 2;

export const PAWNS_PER_SIDE = 3;

export const SIDE = { ME: 0, COMPUTER: 1 } as const;

export const START_PAWNS = [
  [5, 1],
  [5, 5],
  [1, 3],
  [1, 1],
  [1, 5],
  [5, 3],
] as const;
