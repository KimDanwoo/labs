import { SudokuCell } from "@entities/cell/model/types";
import { Difficulty } from "@entities/game/model/types";

export type Grid = number[][];
export type GridPosition = [row: number, col: number];
export type SudokuBoard = SudokuCell[][];

export interface Position {
  row: number;
  col: number;
}

export interface CageInfo {
  paths: { id: number; path: string }[];
  sums: { id: number; sum: number; x: number; y: number }[];
}

export interface RemovalStrategy {
  preferCenter: boolean;
  preferCorners: boolean;
  preferEdges: boolean;
  symmetryBonus: number;
  blockDistribution: boolean;
}

export interface CellPriority {
  pos: GridPosition;
  priority: number;
}

export interface RemovalContext {
  board: SudokuBoard;
  tempGrid: (number | null)[][];
  targetRemove: number;
  difficulty: Difficulty;
}
