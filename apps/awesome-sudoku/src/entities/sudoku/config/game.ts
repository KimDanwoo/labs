import type { ClassicDifficultySpec, Difficulty, KillerDifficultySpec } from '@entities/sudoku/model/types/game';

export const HINTS_REMAINING = 3;

export const GAME_LEVEL = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export const GAME_LEVEL_LABELS = {
  [GAME_LEVEL.EASY]: '쉬움',
  [GAME_LEVEL.MEDIUM]: '중간',
  [GAME_LEVEL.HARD]: '어려움',
  [GAME_LEVEL.EXPERT]: '전문가',
} as const;

export const GAME_MODE = {
  CLASSIC: 'classic',
  KILLER: 'killer',
} as const;

export const GAME_PHASE = {
  GENERATING: 'generating',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  FAILED: 'failed',
} as const;

export const TECHNIQUE = {
  SINGLE: 1,
  LOCKED: 2,
  SUBSET: 3,
  ADVANCED: 4,
  GUESS: 5,
} as const;

export const CLASSIC_DIFFICULTY: Record<Difficulty, ClassicDifficultySpec> = {
  [GAME_LEVEL.EASY]: { clues: 40, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.SINGLE },
  [GAME_LEVEL.MEDIUM]: { clues: 30, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.LOCKED },
  [GAME_LEVEL.HARD]: { clues: 27, minTechnique: TECHNIQUE.LOCKED, maxTechnique: TECHNIQUE.SUBSET },
  [GAME_LEVEL.EXPERT]: { clues: 23, minTechnique: TECHNIQUE.ADVANCED, maxTechnique: TECHNIQUE.ADVANCED },
};

export const KILLER_DIFFICULTY: Record<Difficulty, KillerDifficultySpec> = {
  [GAME_LEVEL.EASY]: { clues: 24, maxCageSize: 3, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.SINGLE },
  [GAME_LEVEL.MEDIUM]: { clues: 14, maxCageSize: 4, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.LOCKED },
  [GAME_LEVEL.HARD]: { clues: 6, maxCageSize: 4, minTechnique: TECHNIQUE.LOCKED, maxTechnique: TECHNIQUE.SUBSET },
  [GAME_LEVEL.EXPERT]: { clues: 0, maxCageSize: 5, minTechnique: TECHNIQUE.SUBSET, maxTechnique: TECHNIQUE.ADVANCED },
};

export const MAX_MISTAKES = 5;
