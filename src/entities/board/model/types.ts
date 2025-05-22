import { SudokuCell } from "@entities/cell/model/types";

export type Grid = number[][];
export type GridPosition = [row: number, col: number];
export type SudokuBoard = SudokuCell[][];

export interface Position {
  row: number;
  col: number;
}
