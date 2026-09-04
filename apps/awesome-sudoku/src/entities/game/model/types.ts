import type { GridPosition, SudokuBoard } from '@entities/board/model/types';
import { GAME_LEVEL, GAME_MODE, TECHNIQUE } from '@entities/game/model/constants';

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];
export type Difficulty = (typeof GAME_LEVEL)[keyof typeof GAME_LEVEL];
export type Technique = (typeof TECHNIQUE)[keyof typeof TECHNIQUE];

export type GradedDifficultySpec = {
  /** 남기는 힌트(주어진 숫자) 수 */
  clues: number;
  /** 사람 기법 채점이 이 범위에 들어야 한다 */
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
