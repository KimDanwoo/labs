export const BOARD_SIZE = 15;

export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export const WIN_LENGTH = 5;

export const CENTER_CELL = (CELL_COUNT - 1) / 2;

export const STONE = { EMPTY: 0, BLACK: 1, WHITE: 2 } as const;

export const PLAYER_STONE = STONE.BLACK;

export const COMPUTER_STONE = STONE.WHITE;

export const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export const NEAR_RADIUS = 2;

export const STAR_POINTS = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
] as const;
