import {
  KILLER_MODE_DEDUCTION,
  POINT_RANGES,
  TIME_THRESHOLDS,
} from "@entities/game-record/model/constants";
import {
  PointInput, PointResult,
} from "@entities/game-record/model/types";
import { GAME_MODE } from "@entities/game/model/constants";

/**
 * 시간 기반 포인트 계산.
 * 난이도별 범위(min~max) 안에서 완료 시간에 따라 선형 보간.
 * 빠를수록 높은 점수, 킬러 모드는 -1 감점.
 */
export function calculatePoint(
  input: PointInput,
): PointResult {
  const { difficulty, gameMode, completionTime } = input;

  const { min, max } = POINT_RANGES[difficulty];
  const { fast, slow } = TIME_THRESHOLDS[difficulty];

  const clamped = Math.max(fast, Math.min(slow, completionTime));
  const ratio = (slow - clamped) / (slow - fast);
  const basePoint =
    Math.round((min + ratio * (max - min)) * 10) / 10;

  const isKiller = gameMode === GAME_MODE.KILLER;
  const killerDeduction = isKiller
    ? KILLER_MODE_DEDUCTION : 0;
  const totalPoint = Math.max(
    min, Math.round((basePoint - killerDeduction) * 10) / 10,
  );

  return { basePoint, killerDeduction, totalPoint };
}

export function formatPoint(point: number): string {
  if (Number.isInteger(point)) return point.toString();
  return point.toFixed(1);
}

/** @deprecated Use formatPoint instead */
export function formatScore(score: number): string {
  if (Number.isInteger(score)) return score.toString();
  return score.toFixed(1);
}
