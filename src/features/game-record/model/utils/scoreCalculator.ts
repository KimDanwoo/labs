import {
  HINT_PENALTIES,
  KILLER_MODE_BONUS,
  MAX_SCORE,
  MIN_SCORE,
  MISTAKE_PENALTIES,
  TIME_ALLOWANCES,
  TIME_PENALTY_RATES,
} from "@entities/game-record/model/constants";
import {
  ScoreBreakdown, ScoreInput,
} from "@entities/game-record/model/types";
import { GAME_MODE } from "@entities/game/model/constants";

export function calculateScore(
  input: ScoreInput,
): ScoreBreakdown {
  const {
    difficulty, gameMode,
    completionTime, hintsUsed, mistakeCount,
  } = input;

  const baseScore = MAX_SCORE;
  const timeAllowance = TIME_ALLOWANCES[difficulty];
  const overtime = Math.max(0, completionTime - timeAllowance);

  const timePenalty = overtime * TIME_PENALTY_RATES[difficulty];
  const hintPenalty = hintsUsed * HINT_PENALTIES[difficulty];
  const mistakePenalty = mistakeCount
    * MISTAKE_PENALTIES[difficulty];

  const isKillerMode = gameMode === GAME_MODE.KILLER;
  const killerBonus = isKillerMode ? KILLER_MODE_BONUS : 0;

  const raw = baseScore - timePenalty - hintPenalty
    - mistakePenalty + killerBonus;
  const totalScore = Math.round(
    Math.max(MIN_SCORE, Math.min(MAX_SCORE, raw)),
  );

  return {
    baseScore,
    timePenalty: Math.round(timePenalty * 10) / 10,
    hintPenalty: Math.round(hintPenalty * 10) / 10,
    mistakePenalty: Math.round(mistakePenalty * 10) / 10,
    killerBonus,
    totalScore,
  };
}

export function formatScore(score: number): string {
  if (Number.isInteger(score)) return score.toString();
  return score.toFixed(1);
}
