export const LOADER_GRID = {
  size: 3,
  cell: 20,
  padding: 6,
  dotRadius: 2.2,
  lineWidth: 3.6,
} as const;

export const LOADER_LOOP: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [3, 1],
  [3, 3],
  [1, 3],
  [1, 2],
  [0, 2],
];
