import { GAME_LEVEL, GAME_MODE, TECHNIQUE } from '../constants/game';
import type { GridPosition, SudokuBoard } from './board';

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];
export type Difficulty = (typeof GAME_LEVEL)[keyof typeof GAME_LEVEL];
export type Technique = (typeof TECHNIQUE)[keyof typeof TECHNIQUE];

export type GradedDifficultySpec = {
  clues: number;
  minTechnique: Technique;
  maxTechnique: Technique;
};

export type ClassicDifficultySpec = GradedDifficultySpec;

export type KillerDifficultySpec = GradedDifficultySpec & { maxCageSize: number };

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
