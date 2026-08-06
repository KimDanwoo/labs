import { CELL_MARK, PUZZLE_DIFFICULTY } from '@entities/stardoku/model/constants';

export type CellMark = (typeof CELL_MARK)[keyof typeof CELL_MARK];

export type PuzzleDifficulty = (typeof PUZZLE_DIFFICULTY)[keyof typeof PUZZLE_DIFFICULTY];

export type MarkGrid = CellMark[][];

/** 셀 → 구역 id (0 ~ size-1) */
export type RegionGrid = number[][];

export interface CellPosition {
  row: number;
  col: number;
}

export interface StardokuPuzzle {
  size: number;
  regions: RegionGrid;
  /** 행별 정답 열 */
  solution: number[];
}

export type Rng = () => number;
