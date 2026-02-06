import { GAME_LEVEL } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";

export const BASE_SCORES: Record<Difficulty, number> = {
  [GAME_LEVEL.EASY]: 1000,
  [GAME_LEVEL.MEDIUM]: 2000,
  [GAME_LEVEL.HARD]: 3000,
  [GAME_LEVEL.EXPERT]: 5000,
};

export const TIME_BONUS_PER_SECOND = 10;
export const TIME_PENALTY_PER_SECOND = 5;
export const HINT_PENALTY = 100;
export const KILLER_MODE_MULTIPLIER = 1.2;
export const MIN_SCORE = 0;
