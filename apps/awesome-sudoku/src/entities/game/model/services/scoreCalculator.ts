import { GAME_MODE } from '../constants/game';
import { KILLER_MODE_DEDUCTION, POINT_RANGES, TIME_THRESHOLDS } from '../constants/record';
import type { PointInput, PointResult } from '../types/record';

export function calculatePoint(input: PointInput): PointResult {
  const { difficulty, gameMode, completionTime } = input;

  const { min, max } = POINT_RANGES[difficulty];
  const { fast, slow } = TIME_THRESHOLDS[difficulty];

  const clamped = Math.max(fast, Math.min(slow, completionTime));
  const ratio = (slow - clamped) / (slow - fast);
  const basePoint = Math.round((min + ratio * (max - min)) * 10) / 10;

  const isKiller = gameMode === GAME_MODE.KILLER;
  const killerDeduction = isKiller ? KILLER_MODE_DEDUCTION : 0;
  const totalPoint = Math.max(min, Math.round((basePoint - killerDeduction) * 10) / 10);

  return { basePoint, killerDeduction, totalPoint };
}

export function formatScore(score: number): string {
  if (Number.isInteger(score)) return score.toString();
  return score.toFixed(1);
}
