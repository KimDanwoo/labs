import { GAME_LEVEL, GAME_MODE, GAME_PHASE, TECHNIQUE } from '../../config/game';
import type { Grid, GridPosition, SudokuBoard } from './board';

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];
export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];
export type Difficulty = (typeof GAME_LEVEL)[keyof typeof GAME_LEVEL];

export interface NewGameRequest {
  mode: GameMode;
  difficulty: Difficulty;
}

export type DiscardAction = { kind: 'newGame'; request: NewGameRequest } | { kind: 'restart' };

export interface KillerPuzzle {
  solution: Grid;
  puzzle: Grid;
  cages: KillerCage[];
}

export interface EncodedKillerPuzzle {
  solution: string;
  givens: string;
  cages: string;
}

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
