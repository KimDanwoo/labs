export interface SudokuCell {
  value: number | null;
  isInitial: boolean;
  isSelected: boolean;
  isConflict: boolean;
  notes: number[];
}

export type SudokuBoard = SudokuCell[][];

export type Difficulty = "easy" | "medium" | "hard";

export interface Position {
  row: number;
  col: number;
}

export interface SudokuState {
  board: SudokuBoard;
  solution: number[][];
  selectedCell: Position | null;
  isCompleted: boolean;
  isSuccess: boolean;
  currentTime: number;
  timerActive: boolean;
  difficulty: Difficulty;
}