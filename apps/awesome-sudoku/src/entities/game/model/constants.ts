import type { Difficulty, DifficultyRange } from '@entities/game/model/types';

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

export const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  [GAME_LEVEL.EASY]: { min: 30, max: 40 },
  [GAME_LEVEL.MEDIUM]: { min: 22, max: 30 },
  [GAME_LEVEL.HARD]: { min: 20, max: 26 },
  [GAME_LEVEL.EXPERT]: { min: 15, max: 19 },
};

export const KILLER_DIFFICULTY_RANGES = {
  [GAME_LEVEL.EASY]: {
    hintsKeep: 25,
    maxCageSize: 3,
  },
  [GAME_LEVEL.MEDIUM]: {
    hintsKeep: 18,
    maxCageSize: 4,
  },
  [GAME_LEVEL.HARD]: {
    hintsKeep: 12,
    maxCageSize: 4,
  },
  [GAME_LEVEL.EXPERT]: {
    hintsKeep: 10,
    maxCageSize: 4,
  },
};

/** 최대 실수 허용 횟수 (초과 시 게임 오버) */
export const MAX_MISTAKES = 5;
