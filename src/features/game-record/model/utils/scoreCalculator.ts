import {
  BASE_POINTS,
  KILLER_MODE_DEDUCTION,
} from "@entities/game-record/model/constants";
import {
  PointInput, PointResult,
} from "@entities/game-record/model/types";
import { GAME_MODE } from "@entities/game/model/constants";

export function calculatePoint(
  input: PointInput,
): PointResult {
  const { difficulty, gameMode } = input;

  const basePoint = BASE_POINTS[difficulty];
  const isKiller = gameMode === GAME_MODE.KILLER;
  const killerDeduction = isKiller
    ? KILLER_MODE_DEDUCTION : 0;
  const totalPoint = basePoint - killerDeduction;

  return { basePoint, killerDeduction, totalPoint };
}

export function formatPoint(point: number): string {
  return point.toString();
}

/** @deprecated Use formatPoint instead */
export function formatScore(score: number): string {
  if (Number.isInteger(score)) return score.toString();
  return score.toFixed(1);
}
