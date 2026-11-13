import type { Grid } from '../model/types/board';

export function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}
