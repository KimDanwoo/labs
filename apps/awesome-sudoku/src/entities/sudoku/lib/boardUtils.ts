import type { Grid } from '@entities/sudoku/model/types/board';

export function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}
