import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@views/home/config/board';
import { atIndex, cellAt } from '@views/home/lib/gridAccess';
import { randomInt, shuffledPositions } from '@views/home/lib/random';
import type { Grid, GridPosition } from '@views/home/model/types/board';
import type { KillerCage } from '@views/home/model/types/game';

const MIN_CAGE_SIZE = 2;
const CAGE_LAYOUT_ATTEMPTS = 20;
const ORTHOGONAL: GridPosition[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const key = (r: number, c: number): number => r * BOARD_SIZE + c;
const neighborsOf = ([r, c]: GridPosition): GridPosition[] =>
  ORTHOGONAL.map(([dr, dc]): GridPosition => [r + dr, c + dc]).filter(
    ([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE,
  );
function isConnected(cells: GridPosition[]): boolean {
  const remaining = new Set(cells.map(([r, c]) => key(r, c)));
  const stack = cells.slice(0, 1);
  stack.forEach(([r, c]) => remaining.delete(key(r, c)));
  for (let current = stack.pop(); current; current = stack.pop()) {
    for (const next of neighborsOf(current)) {
      if (remaining.delete(key(...next))) stack.push(next);
    }
  }
  return remaining.size === 0;
}
interface LayoutState {
  cageOf: number[];
  cages: GridPosition[][];
  valueAt: (position: GridPosition) => number;
  hasValue: (cage: GridPosition[], value: number) => boolean;
}

function growCage(state: LayoutState, start: GridPosition, maxCageSize: number): void {
  const { cageOf, cages, valueAt, hasValue } = state;
  const cage: GridPosition[] = [start];
  const cageIndex = cages.length;
  cageOf[key(...start)] = cageIndex;
  const targetSize = MIN_CAGE_SIZE + randomInt(maxCageSize - MIN_CAGE_SIZE + 1);

  while (cage.length < targetSize) {
    const frontier = cage.flatMap(neighborsOf).filter((p) => cageOf[key(...p)] === -1 && !hasValue(cage, valueAt(p)));
    if (frontier.length === 0) break;
    const next = atIndex(frontier, randomInt(frontier.length));
    cage.push(next);
    cageOf[key(...next)] = cageIndex;
  }

  cages.push(cage);
}

function absorbSingle(state: LayoutState, cage: GridPosition[], maxCageSize: number): void {
  const { cageOf, cages, valueAt, hasValue } = state;
  const ownerOf = (p: GridPosition): GridPosition[] | undefined => cages[atIndex(cageOf, key(...p))];
  const canDonate = (p: GridPosition, taker: GridPosition[]): boolean => {
    const owner = ownerOf(p);
    if (!owner || owner === taker || owner.length <= MIN_CAGE_SIZE || hasValue(taker, valueAt(p))) return false;
    return isConnected(owner.filter((q) => key(...q) !== key(...p)));
  };

  const cell = atIndex(cage, 0);
  const neighbors = neighborsOf(cell);
  const host = neighbors
    .map(ownerOf)
    .find(
      (other) => other !== undefined && other !== cage && other.length < maxCageSize && !hasValue(other, valueAt(cell)),
    );
  if (host) {
    host.push(cell);
    cageOf[key(...cell)] = cages.indexOf(host);
    cage.length = 0;
    return;
  }
  const donor = neighbors.find((p) => canDonate(p, cage));
  const owner = donor && ownerOf(donor);
  if (!donor || !owner) return;
  owner.splice(
    owner.findIndex((q) => key(...q) === key(...donor)),
    1,
  );
  cage.push(donor);
  cageOf[key(...donor)] = cages.indexOf(cage);
}

function layoutCages(solution: Grid, maxCageSize: number): GridPosition[][] {
  const valueAt = ([r, c]: GridPosition): number => cellAt(solution, r, c);
  const state: LayoutState = {
    cageOf: new Array<number>(SUDOKU_CELL_COUNT).fill(-1),
    cages: [],
    valueAt,
    hasValue: (cage, value) => cage.some((p) => valueAt(p) === value),
  };

  for (const start of shuffledPositions()) {
    if (state.cageOf[key(...start)] === -1) growCage(state, start, maxCageSize);
  }

  for (const cage of state.cages) {
    if (cage.length === 1) absorbSingle(state, cage, maxCageSize);
  }

  return state.cages.filter((cage) => cage.length > 0);
}

export function generateKillerCages(solution: Grid, maxCageSize: number): KillerCage[] {
  let best: GridPosition[][] | null = null;
  let bestSingles = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < CAGE_LAYOUT_ATTEMPTS; attempt++) {
    const layout = layoutCages(solution, maxCageSize);
    const singles = layout.filter((cage) => cage.length === 1).length;
    if (singles < bestSingles) {
      bestSingles = singles;
      best = layout;
    }
  }

  return best!.map((cells, index) => ({
    id: index + 1,
    cells,
    sum: cells.reduce((total, [r, c]) => total + cellAt(solution, r, c), 0),
  }));
}
