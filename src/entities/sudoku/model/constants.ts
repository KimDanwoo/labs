import { Difficulty, DifficultyRange } from "@entities/sudoku/model";

export const GRID_SIZE = 9;
export const BLOCK_SIZE = 3;
export const NUMBERS = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);

export const KEY_NUMBER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const EASY = "easy";
export const MEDIUM = "medium";
export const HARD = "hard";
export const EXPERT = "expert";
export const IMPOSSIBLE = "impossible";

export const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  [EASY]: { min: 28, max: 35 },
  [MEDIUM]: { min: 40, max: 50 },
  [HARD]: { min: 52, max: 62 },
  [EXPERT]: { min: 63, max: 72 },
  [IMPOSSIBLE]: { min: 73, max: 81 },
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
