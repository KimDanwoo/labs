import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@entities/sudoku/config/board';
import type { LogicBoard } from '@entities/sudoku/lib/logic/logicBoard';
import {
  ALL_DIGITS,
  bit,
  BOX_UNITS,
  COL_UNITS,
  combinations,
  digitsOf,
  EMPTY,
  popcount,
  ROW_UNITS,
  UNITS,
} from '@entities/sudoku/lib/solverGrid';

const MAX_SUBSET_SIZE = 4;
const MAX_HIDDEN_SUBSET_SIZE = 3;

const LINE_UNITS = [...ROW_UNITS, ...COL_UNITS];

export function createBasicTechniques({ cells, cands, place, openSpots, eliminate }: LogicBoard) {
  const nakedSingles = (): boolean => {
    let progressed = false;
    for (let i = 0; i < SUDOKU_CELL_COUNT; i++) {
      if (cells[i] !== EMPTY || popcount(cands[i]!) !== 1) continue;
      place(i, digitsOf(cands[i]!)[0]!);
      progressed = true;
    }
    return progressed;
  };

  const hiddenSingles = (): boolean => {
    let progressed = false;
    for (const unit of UNITS) {
      for (let d = 1; d <= BOARD_SIZE; d++) {
        const spots = openSpots(unit, d);
        if (spots.length !== 1) continue;
        place(spots[0]!, d);
        progressed = true;
      }
    }
    return progressed;
  };

  const eliminateConfined = (containers: number[][], crossings: number[][], d: number): boolean => {
    let progressed = false;
    for (const container of containers) {
      const spots = openSpots(container, d);
      if (spots.length < 2) continue;
      for (const crossing of crossings.filter((unit) => spots.every((i) => unit.includes(i)))) {
        const outside = crossing.filter((i) => !container.includes(i));
        progressed = eliminate(outside, bit(d)) || progressed;
      }
    }
    return progressed;
  };

  const lockedCandidates = (): boolean => {
    let progressed = false;
    for (let d = 1; d <= BOARD_SIZE; d++) {
      progressed = eliminateConfined(BOX_UNITS, LINE_UNITS, d) || progressed;
      progressed = eliminateConfined(LINE_UNITS, BOX_UNITS, d) || progressed;
    }
    return progressed;
  };

  const nakedSubsetsInSize = (empty: number[], size: number): boolean => {
    let progressed = false;
    for (const subset of combinations(empty, size)) {
      const union = subset.reduce((m, i) => m | cands[i]!, 0);
      if (popcount(union) !== size) continue;
      const others = empty.filter((i) => !subset.includes(i));
      progressed = eliminate(others, union) || progressed;
    }
    return progressed;
  };

  const nakedSubsets = (): boolean => {
    let progressed = false;
    for (const unit of UNITS) {
      const empty = unit.filter((i) => cells[i] === EMPTY);
      for (let size = 2; size <= MAX_SUBSET_SIZE && size < empty.length; size++) {
        progressed = nakedSubsetsInSize(empty, size) || progressed;
      }
    }
    return progressed;
  };

  const hiddenSubsetsInSize = (empty: number[], missing: number[], size: number): boolean => {
    let progressed = false;
    for (const digits of combinations(missing, size)) {
      const mask = digits.reduce((m, d) => m | bit(d), 0);
      const spots = empty.filter((i) => cands[i]! & mask);
      if (spots.length !== size) continue;
      progressed = eliminate(spots, ALL_DIGITS & ~mask) || progressed;
    }
    return progressed;
  };

  const hiddenSubsets = (): boolean => {
    let progressed = false;
    for (const unit of UNITS) {
      const empty = unit.filter((i) => cells[i] === EMPTY);
      const missing = digitsOf(empty.reduce((m, i) => m | cands[i]!, 0));
      for (let size = 2; size <= MAX_HIDDEN_SUBSET_SIZE && size < missing.length; size++) {
        progressed = hiddenSubsetsInSize(empty, missing, size) || progressed;
      }
    }
    return progressed;
  };

  return { nakedSingles, hiddenSingles, lockedCandidates, nakedSubsets, hiddenSubsets };
}
