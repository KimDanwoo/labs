import { GAME_LEVEL } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";

/** 난이도별 기본 포인트 */
export const BASE_POINTS: Record<Difficulty, number> = {
  [GAME_LEVEL.EASY]: 4,
  [GAME_LEVEL.MEDIUM]: 6,
  [GAME_LEVEL.HARD]: 8,
  [GAME_LEVEL.EXPERT]: 10,
};

/** 킬러 모드 감점 (케이지 합계 힌트가 있으므로 포인트 차감) */
export const KILLER_MODE_DEDUCTION = 1;

export const DEFAULT_USER_RECORD_LIMIT = 20;
export const LEADERBOARD_RECORD_LIMIT = 100;
export const CUMULATIVE_RECORD_LIMIT = 1000;
