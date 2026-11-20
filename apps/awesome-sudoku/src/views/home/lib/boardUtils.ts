import type { Grid } from '@views/home/model/types/board';

export function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}
