import type { Grid } from './types';

/**
 * 그리드를 깊은 복사하여 반환
 * @param grid - 복사할 그리드
 * @returns 복사된 그리드
 */
export function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}
