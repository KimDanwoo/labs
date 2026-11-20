import { CORNER_BLOCK_OFFSETS, EDGE, NEIGHBOR_OFFSETS } from '@views/slitherlink/config/board';
import { REGION_FILL_RATIO } from '@views/slitherlink/config/difficulty';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { randomInt, shuffled } from '@views/slitherlink/lib/random';
import type { EdgeState, GridTopology, Random } from '@views/slitherlink/model/types/slitherlink';

const isInBoard = (size: number, row: number, col: number): boolean => row >= 0 && col >= 0 && row < size && col < size;

const isInside = (region: readonly boolean[], size: number, row: number, col: number): boolean =>
  isInBoard(size, row, col) && itemAt(region, row * size + col);

const neighborsOf = (size: number, cell: number): number[] => {
  const row = Math.floor(cell / size);
  const col = cell % size;
  return NEIGHBOR_OFFSETS.flatMap(([dRow, dCol]) =>
    isInBoard(size, row + dRow, col + dCol) ? [(row + dRow) * size + col + dCol] : [],
  );
};

const isCheckerboard = (region: readonly boolean[], size: number, row: number, col: number): boolean => {
  const topLeft = isInside(region, size, row, col);
  const topRight = isInside(region, size, row, col + 1);
  const bottomLeft = isInside(region, size, row + 1, col);
  const bottomRight = isInside(region, size, row + 1, col + 1);
  return topLeft === bottomRight && topRight === bottomLeft && topLeft !== topRight;
};

const touchesItselfAtCorner = (region: readonly boolean[], size: number, cell: number): boolean => {
  const row = Math.floor(cell / size);
  const col = cell % size;
  return CORNER_BLOCK_OFFSETS.some(([dRow, dCol]) => isCheckerboard(region, size, row + dRow, col + dCol));
};

const isOnBorder = (size: number, cell: number): boolean => {
  const row = Math.floor(cell / size);
  const col = cell % size;
  return row === 0 || col === 0 || row === size - 1 || col === size - 1;
};

const outsideReachesBorder = (region: readonly boolean[], size: number): boolean => {
  const outside = region.flatMap((inside, cell) => (inside ? [] : [cell]));
  const reached = new Set(outside.filter((cell) => isOnBorder(size, cell)));
  const stack = [...reached];
  for (let cell = stack.pop(); cell !== undefined; cell = stack.pop()) {
    for (const next of neighborsOf(size, cell)) {
      if (itemAt(region, next) || reached.has(next)) continue;
      reached.add(next);
      stack.push(next);
    }
  }
  return reached.size === outside.length;
};

const canGrowInto = (region: readonly boolean[], size: number, cell: number): boolean => {
  const grown = [...region];
  grown[cell] = true;
  return !touchesItselfAtCorner(grown, size, cell) && outsideReachesBorder(grown, size);
};

const frontierOf = (region: readonly boolean[], size: number): number[] =>
  region.flatMap((inside, cell) =>
    !inside && neighborsOf(size, cell).some((next) => itemAt(region, next)) ? [cell] : [],
  );

const insideNeighborCount = (region: readonly boolean[], size: number, cell: number): number =>
  neighborsOf(size, cell).filter((next) => itemAt(region, next)).length;

const growthOrder = (region: readonly boolean[], size: number, random: Random): number[] =>
  shuffled(random, frontierOf(region, size)).sort(
    (first, second) => insideNeighborCount(region, size, first) - insideNeighborCount(region, size, second),
  );

export const growLoopRegion = (size: number, random: Random): boolean[] => {
  const cellCount = size * size;
  const region = Array.from({ length: cellCount }, () => false);
  region[randomInt(random, cellCount)] = true;
  const target = Math.round(cellCount * REGION_FILL_RATIO);
  for (let count = 1; count < target; count += 1) {
    const next = growthOrder(region, size, random).find((cell) => canGrowInto(region, size, cell));
    if (next === undefined) break;
    region[next] = true;
  }
  return region;
};

export const regionBoundary = (region: readonly boolean[], topology: GridTopology): EdgeState[] =>
  topology.edgeCells.map((cells) =>
    cells.filter((cell) => itemAt(region, cell)).length === 1 ? EDGE.LINE : EDGE.CROSS,
  );
