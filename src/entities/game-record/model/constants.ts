import { GAME_LEVEL } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";

export const MAX_SCORE = 9;
export const MIN_SCORE = 1;

/** 시간 허용치 (초) — 이 시간 이내면 감점 없음 */
export const TIME_ALLOWANCES: Record<Difficulty, number> = {
  [GAME_LEVEL.EASY]: 600,
  [GAME_LEVEL.MEDIUM]: 900,
  [GAME_LEVEL.HARD]: 1200,
  [GAME_LEVEL.EXPERT]: 1800,
};

/** 초과 시간 1초당 감점률 */
export const TIME_PENALTY_RATES: Record<Difficulty, number> = {
  [GAME_LEVEL.EASY]: 0.005,
  [GAME_LEVEL.MEDIUM]: 0.008,
  [GAME_LEVEL.HARD]: 0.012,
  [GAME_LEVEL.EXPERT]: 0.015,
};

/** 힌트 1회당 감점 */
export const HINT_PENALTIES: Record<Difficulty, number> = {
  [GAME_LEVEL.EASY]: 0.5,
  [GAME_LEVEL.MEDIUM]: 0.7,
  [GAME_LEVEL.HARD]: 1.0,
  [GAME_LEVEL.EXPERT]: 1.5,
};

/** 실수 1회당 감점 */
export const MISTAKE_PENALTIES: Record<Difficulty, number> = {
  [GAME_LEVEL.EASY]: 0.3,
  [GAME_LEVEL.MEDIUM]: 0.5,
  [GAME_LEVEL.HARD]: 0.7,
  [GAME_LEVEL.EXPERT]: 1.0,
};

/** 킬러 모드 보너스 */
export const KILLER_MODE_BONUS = 0.5;
