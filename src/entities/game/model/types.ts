import { GridPosition, Position, SudokuBoard } from "@entities/board/model/types";
import { CellHighlight, SudokuCell } from "@entities/cell/model/types";
import { GAME_LEVEL, GAME_MODE } from "@entities/game/model/constants";

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];
export type Difficulty = (typeof GAME_LEVEL)[keyof typeof GAME_LEVEL];
export type DifficultyRange = { min: number; max: number };

export interface KillerCage {
  cells: GridPosition[];
  sum: number;
  id: number;
}

export interface SudokuState {
  board: SudokuCell[][];
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
  hintsRemaining: number;
  gameMode: GameMode;
  cages: KillerCage[];
}

export interface GameCompletionResult {
  completed: boolean;
  success: boolean;
  board: SudokuBoard;
}
