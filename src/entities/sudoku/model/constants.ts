import { Difficulty, DifficultyRange } from "@entities/sudoku/model";

export const GRID_SIZE = 9;
export const BLOCK_SIZE = 3;
export const NUMBERS = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
export const HINTS_REMAINING = 5;

export const KEY_NUMBER = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const NUMBER_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

export const EASY = "easy";
export const MEDIUM = "medium";
export const HARD = "hard";
export const EXPERT = "expert";

export const CLASSIC_MODE = "classic";
export const KILLER_MODE = "killer";

export const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  [EASY]: { min: 28, max: 35 },
  [MEDIUM]: { min: 40, max: 55 },
  [HARD]: { min: 60, max: 65 },
  [EXPERT]: { min: 70, max: 75 },
};

export const KILLER_DIFFICULTY_RANGES = {
  [EASY]: {
    hintsKeep: 25, // 유지할 힌트 셀 수
    maxCageSize: 3, // 최대 케이지 크기
  },
  [MEDIUM]: {
    hintsKeep: 23,
    maxCageSize: 4,
  },
  [HARD]: {
    hintsKeep: 20,
    maxCageSize: 5,
  },
  [EXPERT]: {
    hintsKeep: 15,
    maxCageSize: 6,
  },
};

// 기본 패턴 - Latin Square 기반 유효한 스도쿠
export const BASE_GRID = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 1, 4, 3, 6, 5, 8, 9, 7],
  [3, 6, 5, 8, 9, 7, 2, 1, 4],
  [8, 9, 7, 2, 1, 4, 3, 6, 5],
  [5, 3, 1, 6, 4, 2, 9, 7, 8],
  [6, 4, 2, 9, 7, 8, 5, 3, 1],
  [9, 7, 8, 5, 3, 1, 6, 4, 2],
];
