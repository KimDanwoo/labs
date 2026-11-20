import { DEFAULT_CELL_SIZE } from '@views/home/config/board';
import type { CageInfo } from '@views/home/model/types/board';

const PATH_START_PATTERN = /M([\d.]+),([\d.]+)/;

function pathStartX(path: string | undefined): number | null {
  const x = path?.match(PATH_START_PATTERN)?.[1];
  return x ? parseFloat(x) : null;
}

export function cellSizeFromPaths(paths: CageInfo['paths']): number {
  const firstX = pathStartX(paths[0]?.path);
  const secondX = pathStartX(paths[1]?.path);
  if (firstX === null || secondX === null) return DEFAULT_CELL_SIZE;
  return Math.max(Math.abs(secondX - firstX), DEFAULT_CELL_SIZE);
}
