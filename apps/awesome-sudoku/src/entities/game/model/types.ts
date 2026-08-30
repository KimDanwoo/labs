import type { GridPosition, SudokuBoard } from '@entities/board/model/types';
import { GAME_LEVEL, GAME_MODE } from '@entities/game/model/constants';

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];
export type Difficulty = (typeof GAME_LEVEL)[keyof typeof GAME_LEVEL];
export type DifficultyRange = { min: number; max: number };

export interface KillerCage {
  cells: GridPosition[];
  sum: number;
  id: number;
}

export interface GameCompletionResult {
  completed: boolean;
  success: boolean;
  board: SudokuBoard;
}
