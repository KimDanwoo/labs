import { SudokuCell } from "@entities/cell/model/types";

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
