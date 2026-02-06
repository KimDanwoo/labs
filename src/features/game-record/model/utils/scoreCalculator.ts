import {
  BASE_SCORES,
  HINT_PENALTY,
  KILLER_MODE_MULTIPLIER,
  MIN_SCORE,
  TIME_BONUS_PER_SECOND,
  TIME_PENALTY_PER_SECOND,
} from "@entities/game-record/model/constants";
import { ScoreBreakdown, ScoreInput } from "@entities/game-record/model/types";
import { TARGET_TIMES, GAME_MODE } from "@entities/game/model/constants";

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const { difficulty, gameMode, completionTime, hintsUsed } = input;

  const baseScore = BASE_SCORES[difficulty];
  const targetTime = TARGET_TIMES[difficulty];

  const timeDiff = targetTime - completionTime;
  const timeBonus = timeDiff > 0 ? timeDiff * TIME_BONUS_PER_SECOND : 0;
  const timePenalty = timeDiff < 0 ? Math.abs(timeDiff) * TIME_PENALTY_PER_SECOND : 0;

  const hintPenalty = hintsUsed * HINT_PENALTY;

  const isKillerMode = gameMode === GAME_MODE.KILLER;
  const subtotal = baseScore + timeBonus - timePenalty - hintPenalty;
  const killerBonus = isKillerMode ? Math.round(subtotal * (KILLER_MODE_MULTIPLIER - 1)) : 0;

  const totalScore = Math.max(MIN_SCORE, subtotal + killerBonus);

  return {
    baseScore,
    timeBonus,
    timePenalty,
    hintPenalty,
    killerBonus,
    totalScore,
  };
}

export function formatScore(score: number): string {
  return score.toLocaleString("ko-KR");
}
