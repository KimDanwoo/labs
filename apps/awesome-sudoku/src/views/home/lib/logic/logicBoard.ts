import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '../../config/board';
import type { Grid } from '../../model/types/board';
import type { KillerCage } from '../../model/types/game';
import { cageCombos } from '../cageCombos';
import { ALL_DIGITS, bit, EMPTY, flatten, PEERS } from '../solverGrid';

export type LogicCage = { cells: number[]; sum: number; combos: number[] };

export function createLogicBoard(grid: Grid, cages: KillerCage[]) {
  const cells = flatten(grid);
  const cands = new Array<number>(SUDOKU_CELL_COUNT).fill(ALL_DIGITS);

  const place = (i: number, v: number): void => {
    cells[i] = v;
    cands[i] = 0;
    for (const p of PEERS[i]!) cands[p]! &= ~bit(v);
  };

  const cageInfos: LogicCage[] = cages.map((cage) => ({
    cells: cage.cells.map(([r, c]) => r * BOARD_SIZE + c),
    sum: cage.sum,
    combos: cageCombos(cage.cells.length, cage.sum),
  }));
  const cageOfCell = new Array<LogicCage | undefined>(SUDOKU_CELL_COUNT).fill(undefined);
  cageInfos.forEach((cage) => cage.cells.forEach((i) => (cageOfCell[i] = cage)));

  cells.forEach((v, i) => {
    if (v !== EMPTY) place(i, v);
  });

  const isSolved = (): boolean => cells.every((v) => v !== EMPTY);

  const hasCandidate = (i: number, d: number): boolean => cells[i] === EMPTY && (cands[i]! & bit(d)) !== 0;
  const openSpots = (unit: number[], d: number): number[] => unit.filter((i) => hasCandidate(i, d));

  const eliminate = (targets: number[], mask: number): boolean => {
    let progressed = false;
    for (const i of targets) {
      if (cells[i] !== EMPTY || (cands[i]! & mask) === 0) continue;
      cands[i]! &= ~mask;
      progressed = true;
    }
    return progressed;
  };

  return { cells, cands, cageInfos, place, isSolved, hasCandidate, openSpots, eliminate };
}

export type LogicBoard = ReturnType<typeof createLogicBoard>;
