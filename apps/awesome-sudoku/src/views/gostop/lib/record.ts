import { SIDE } from '@views/gostop/config/game';
import { isPlainObject } from '@views/gostop/lib/storage';
import type { GameResult } from '@views/gostop/model/types/gostop';
import type { GameRecord } from '@views/gostop/model/types/record';

export const EMPTY_RECORD: GameRecord = {
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  streak: 0,
  bestPoints: 0,
  lastGameId: null,
};

const COUNT_FIELDS = ['played', 'wins', 'losses', 'draws', 'streak', 'bestPoints'] as const;
const INVALID_COUNT = -1;

function countOr(value: unknown): number {
  const isCount = Number.isSafeInteger(value) && Number(value) >= 0;
  return isCount ? Number(value) : INVALID_COUNT;
}

const idOr = (value: unknown): string | null | undefined => {
  if (value === undefined) return null;
  const isId = value === null || typeof value === 'string';
  return isId ? value : undefined;
};

export function parseRecord(raw: unknown): GameRecord {
  if (!isPlainObject(raw)) return EMPTY_RECORD;
  const lastGameId = idOr(raw.lastGameId);
  if (lastGameId === undefined) return EMPTY_RECORD;
  const record: GameRecord = {
    played: countOr(raw.played),
    wins: countOr(raw.wins),
    losses: countOr(raw.losses),
    draws: countOr(raw.draws),
    streak: countOr(raw.streak),
    bestPoints: countOr(raw.bestPoints),
    lastGameId,
  };
  const hasValidCounts = COUNT_FIELDS.every((field) => record[field] !== INVALID_COUNT);
  return hasValidCounts ? record : EMPTY_RECORD;
}

function tally(record: GameRecord, result: GameResult): GameRecord {
  if (result.winner === SIDE.ME) {
    return {
      ...record,
      wins: record.wins + 1,
      streak: record.streak + 1,
      bestPoints: Math.max(record.bestPoints, result.points),
    };
  }
  if (result.winner === SIDE.COMPUTER) return { ...record, losses: record.losses + 1, streak: 0 };
  return { ...record, draws: record.draws + 1 };
}

export function recordGame(record: GameRecord, gameId: string, result: GameResult): GameRecord {
  if (record.lastGameId === gameId) return record;
  return { ...tally(record, result), played: record.played + 1, lastGameId: gameId };
}
