export const EDGE = {
  UNKNOWN: 0,
  LINE: 1,
  CROSS: 2,
} as const;

export const LOOP_VERTEX_DEGREE = 2;

export const NEIGHBOR_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export const CORNER_BLOCK_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [0, -1],
  [0, 0],
] as const;
