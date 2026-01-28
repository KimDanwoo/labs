import { Difficulty } from "@entities/game/model/types";

// Cell types (merged from entities/cell)
export interface SudokuCell {
  value: number | null;
  isInitial: boolean;
  isSelected: boolean;
  isConflict: boolean;
  notes: number[];
}

export interface CellProps {
  cell: SudokuCell;
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
}

export interface CellHighlight {
  selected: boolean;
  related: boolean;
  sameValue: boolean;
}

// Board types
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
