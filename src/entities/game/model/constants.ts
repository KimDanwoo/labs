import { Difficulty, DifficultyRange } from "@entities/game/model/types";

export const HINTS_REMAINING = 5;

export const GAME_LEVEL = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
  EXPERT: "expert",
};

export const GAME_MODE = {
  CLASSIC: "classic",
  KILLER: "killer",
};

export const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  [GAME_LEVEL.EASY]: { min: 28, max: 35 },
  [GAME_LEVEL.MEDIUM]: { min: 40, max: 55 },
  [GAME_LEVEL.HARD]: { min: 60, max: 65 },
  [GAME_LEVEL.EXPERT]: { min: 70, max: 75 },
};

export const KILLER_DIFFICULTY_RANGES = {
  [GAME_LEVEL.EASY]: {
    hintsKeep: 25,
    maxCageSize: 3,
  },
  [GAME_LEVEL.MEDIUM]: {
    hintsKeep: 23,
    maxCageSize: 4,
  },
  [GAME_LEVEL.HARD]: {
    hintsKeep: 20,
    maxCageSize: 5,
  },
  [GAME_LEVEL.EXPERT]: {
    hintsKeep: 15,
    maxCageSize: 6,
  },
};
