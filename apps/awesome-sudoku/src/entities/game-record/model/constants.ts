import { GAME_LEVEL } from '@entities/game/model/constants';
import { Difficulty } from '@entities/game/model/types';

/** 난이도별 포인트 범위 (시간에 따라 min~max 선형 보간) */
export const POINT_RANGES: Record<Difficulty, { min: number; max: number }> = {
  [GAME_LEVEL.EASY]: { min: 1, max: 3 },
  [GAME_LEVEL.MEDIUM]: { min: 3, max: 6 },
  [GAME_LEVEL.HARD]: { min: 6, max: 9 },
  [GAME_LEVEL.EXPERT]: { min: 9, max: 12 },
};

/** 난이도별 시간 기준 (초). fast 이하 → 최고점, slow 이상 → 최저점 */
export const TIME_THRESHOLDS: Record<Difficulty, { fast: number; slow: number }> = {
  [GAME_LEVEL.EASY]: { fast: 180, slow: 900 },
  [GAME_LEVEL.MEDIUM]: { fast: 300, slow: 1200 },
  [GAME_LEVEL.HARD]: { fast: 600, slow: 1800 },
  [GAME_LEVEL.EXPERT]: { fast: 900, slow: 2700 },
};

/** 킬러 모드 감점 (케이지 합계 힌트가 있으므로 포인트 차감) */
export const KILLER_MODE_DEDUCTION = 1;

export const DEFAULT_USER_RECORD_LIMIT = 20;
export const LEADERBOARD_RECORD_LIMIT = 100;
export const CUMULATIVE_RECORD_LIMIT = 1000;
