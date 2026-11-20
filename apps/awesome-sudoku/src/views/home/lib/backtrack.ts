import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@views/home/config/board';
import { type CageState, cageAllowedMask, cageCombos } from '@views/home/lib/cageCombos';
import {
  ALL_DIGITS,
  EMPTY,
  bit,
  boxOf,
  colOf,
  digitsOf,
  flatten,
  popcount,
  rowOf,
  unflatten,
} from '@views/home/lib/solverGrid';
import { createEmptyGrid, shuffleArray } from '@views/home/model/services/common';
import type { Grid } from '@views/home/model/types/board';
import type { KillerCage } from '@views/home/model/types/game';

type SearchOptions = {
  limit: number;
  randomize: boolean;
  cages?: KillerCage[];
  /** 방문 노드 상한. 넘기면 exhausted=true로 중단한다 — 힌트가 거의 없는 킬러 판에서 탐색이 폭발하는 것을 막는다. */
  nodeBudget?: number;
  exclude?: { index: number; digit: number };
};
const NO_CELL = -1;
type SearchResult = { count: number; solution: number[] | null; exhausted: boolean };
function search(
  initial: number[],
  { limit, randomize, cages, nodeBudget = Number.POSITIVE_INFINITY, exclude }: SearchOptions,
): SearchResult {
  const cells = [...initial];
  const rowUsed = new Array<number>(BOARD_SIZE).fill(0);
  const colUsed = new Array<number>(BOARD_SIZE).fill(0);
  const boxUsed = new Array<number>(BOARD_SIZE).fill(0);
  const cageOf = new Array<number>(SUDOKU_CELL_COUNT).fill(-1);
  const cageStates: CageState[] = [];

  cages?.forEach((cage, cageIndex) => {
    cage.cells.forEach(([r, c]) => {
      cageOf[r * BOARD_SIZE + c] = cageIndex;
    });
    cageStates.push({ combos: cageCombos(cage.cells.length, cage.sum), usedMask: 0, allowedCache: new Map() });
  });

  cells.forEach((v, i) => {
    if (v === EMPTY) return;
    rowUsed[rowOf(i)]! |= bit(v);
    colUsed[colOf(i)]! |= bit(v);
    boxUsed[boxOf(i)]! |= bit(v);
    const cage = cageStates[cageOf[i]!];
    if (cage) cage.usedMask |= bit(v);
  });

  // 주어진 칸이 어떤 조합에도 맞지 않는 케이지(합 불일치·중복)는 해가 없다 — 탐색은 빈 칸에서만 케이지를 본다
  const isInconsistent = cageStates.some(
    (cage) => !cage.combos.some((combo) => (combo & cage.usedMask) === cage.usedMask),
  );
  if (isInconsistent) return { count: 0, solution: null, exhausted: false };

  const candidatesOf = (i: number): number => {
    let mask = ALL_DIGITS & ~(rowUsed[rowOf(i)]! | colUsed[colOf(i)]! | boxUsed[boxOf(i)]!);
    if (exclude && exclude.index === i) mask &= ~bit(exclude.digit);
    const cage = cageStates[cageOf[i]!];
    return cage ? mask & cageAllowedMask(cage) : mask;
  };

  const place = (i: number, v: number, on: boolean): void => {
    const b = bit(v);
    if (on) {
      cells[i] = v;
      rowUsed[rowOf(i)]! |= b;
      colUsed[colOf(i)]! |= b;
      boxUsed[boxOf(i)]! |= b;
    } else {
      cells[i] = EMPTY;
      rowUsed[rowOf(i)]! &= ~b;
      colUsed[colOf(i)]! &= ~b;
      boxUsed[boxOf(i)]! &= ~b;
    }
    const cage = cageStates[cageOf[i]!];
    if (!cage) return;
    if (on) cage.usedMask |= b;
    else cage.usedMask &= ~b;
  };

  const pickBranchCell = (): { cell: number; mask: number } => {
    let best = { cell: NO_CELL, mask: 0 };
    let bestSize = BOARD_SIZE + 1;
    for (let i = 0; i < SUDOKU_CELL_COUNT; i++) {
      if (cells[i] !== EMPTY) continue;
      const mask = candidatesOf(i);
      const size = popcount(mask);
      if (size === 0) return { cell: i, mask: 0 };
      if (size < bestSize) {
        bestSize = size;
        best = { cell: i, mask };
        if (size === 1) break;
      }
    }
    return best;
  };

  let count = 0;
  let nodes = 0;
  let exhausted = false;
  let solution: number[] | null = null;

  const step = (): boolean => {
    if (++nodes > nodeBudget) {
      exhausted = true;
      return true;
    }

    const { cell: bestCell, mask: bestMask } = pickBranchCell();
    if (bestCell === NO_CELL) {
      count++;
      solution ??= [...cells];
      return count >= limit;
    }
    if (bestMask === 0) return false;

    const digits = digitsOf(bestMask);
    if (randomize) shuffleArray(digits);

    for (const d of digits) {
      place(bestCell, d, true);
      const done = step();
      place(bestCell, d, false);
      if (done) return true;
    }
    return false;
  };

  step();
  return { count, solution, exhausted };
}
/**
 * @description 해의 개수를 limit까지 센다 (limit=2면 유일해 판정용). 0은 빈 칸.
 * 노드 예산을 넘겨 판정을 못 하면 limit을 돌려준다(유일하지 않은 것으로 간주 — 안전한 쪽).
 */

export function countSolutions(grid: Grid, limit: number, cages?: KillerCage[], nodeBudget?: number): number {
  const { count, exhausted } = search(flatten(grid), { limit, randomize: false, cages, nodeBudget });
  return exhausted ? limit : count;
}

export const hasUniqueSolution = (grid: Grid, cages?: KillerCage[], nodeBudget?: number): boolean =>
  countSolutions(grid, 2, cages, nodeBudget) === 1;
/**
 * @description 유일해였던 퍼즐에서 (row, col)을 비웠을 때도 유일한가 — 그 칸에 원래 값이 아닌 값을 넣은 해가 없어야 한다.
 * 해를 둘까지 세는 것보다 싸다: 이미 아는 해를 다시 찾지 않고 대안만 찾는다. 예산을 넘기면 유일하지 않은 것으로 본다.
 */

export function staysUniqueWithout(
  grid: Grid,
  [row, col]: [number, number],
  originalValue: number,
  cages?: KillerCage[],
  nodeBudget?: number,
): boolean {
  const cells = flatten(grid);
  const index = row * BOARD_SIZE + col;
  cells[index] = EMPTY;
  const { count, exhausted } = search(cells, {
    limit: 1,
    randomize: false,
    cages,
    nodeBudget,
    exclude: { index, digit: originalValue },
  });
  return !exhausted && count === 0;
}

export function generateRandomSolution(): Grid {
  const { solution } = search(flatten(createEmptyGrid()), { limit: 1, randomize: true });
  if (!solution) throw new Error('빈 스도쿠 판을 채우지 못했습니다');
  return unflatten(solution);
}
