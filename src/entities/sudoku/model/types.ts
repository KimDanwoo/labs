import { CLASSIC_MODE, EASY, EXPERT, HARD, IMPOSSIBLE, KILLER_MODE, MEDIUM } from "./constants";

export type GameMode = typeof CLASSIC_MODE | typeof KILLER_MODE;
export type Grid = number[][];
export type GridPosition = [row: number, col: number];
export type Difficulty = typeof EASY | typeof MEDIUM | typeof HARD | typeof EXPERT | typeof IMPOSSIBLE;
export type DifficultyRange = { min: number; max: number };

export interface SudokuCell {
  value: number | null;
  isInitial: boolean;
  isSelected: boolean;
  isConflict: boolean;
  notes: number[];
}

export type SudokuBoard = SudokuCell[][];

export interface Position {
  row: number;
  col: number;
}

export interface HighlightInfo {
  selectedCell: Position | null;
  highlightedCells: Set<string>;
  sameValueCells: Set<string>;
}

export interface SudokuState {
  board: SudokuBoard;
  isNoteMode: boolean;
  solution: number[][];
  selectedCell: Position | null;
  isCompleted: boolean;
  isSuccess: boolean;
  currentTime: number;
  timerActive: boolean;
  difficulty: Difficulty;
  highlightedCells: Record<string, CellHighlight>;
  numberCounts: Record<number, number>;
}

export interface CellHighlight {
  selected: boolean;
  related: boolean;
  sameValue: boolean;
}
