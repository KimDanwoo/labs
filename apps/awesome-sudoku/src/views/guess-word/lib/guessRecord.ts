import { isValidGuess, type GuessResult } from '@entities/guess-word';
import { GUESS_STATUS, NOTICE_KIND } from '@views/guess-word/config/game';
import type { GuessEntry, GuessRecord, GuessStatus, Notice } from '@views/guess-word/model/types/guessWord';

const STATUSES: readonly string[] = Object.values(GUESS_STATUS);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGuessEntry(value: unknown): value is GuessEntry {
  if (!isObject(value)) return false;
  const hasValidRank = value.rank === null || typeof value.rank === 'number';
  return (
    typeof value.word === 'string' &&
    typeof value.similarity === 'number' &&
    typeof value.order === 'number' &&
    hasValidRank
  );
}

function isGuessStatus(value: unknown): value is GuessStatus {
  return typeof value === 'string' && STATUSES.includes(value);
}

export function emptyRecord(day: number): GuessRecord {
  return { day, guesses: [], status: GUESS_STATUS.PLAYING, answer: null };
}

export function parseRecord(value: unknown, day: number): GuessRecord {
  const isSameDay = isObject(value) && value.day === day;
  if (!isSameDay) return emptyRecord(day);
  const guesses = Array.isArray(value.guesses) ? value.guesses.filter(isGuessEntry) : [];
  const status = isGuessStatus(value.status) ? value.status : GUESS_STATUS.PLAYING;
  const hasSolvedAnswer = status === GUESS_STATUS.SOLVED && typeof value.answer === 'string';
  const answer = hasSolvedAnswer ? String(value.answer) : null;
  return { day, guesses, status, answer };
}

export function hasGuessed(record: GuessRecord, word: string): boolean {
  return record.guesses.some((entry) => entry.word === word);
}

export function invalidGuessNotice(word: string): Notice | null {
  return isValidGuess(word) ? null : { kind: NOTICE_KIND.INVALID, word };
}

export function addGuess(record: GuessRecord, result: GuessResult): GuessRecord {
  if (hasGuessed(record, result.word)) return record;
  const entry = {
    word: result.word,
    similarity: result.similarity,
    rank: result.rank,
    order: record.guesses.length + 1,
  };
  const isFirstSolve = result.isAnswer && record.status === GUESS_STATUS.PLAYING;
  const solved = isFirstSolve ? { status: GUESS_STATUS.SOLVED, answer: result.word } : {};
  return { ...record, guesses: [...record.guesses, entry], ...solved };
}

export function sortBySimilarity(guesses: GuessEntry[]): GuessEntry[] {
  return [...guesses].sort((a, b) => b.similarity - a.similarity || a.order - b.order);
}

export function spotlightGuess(guesses: GuessEntry[], word: string | null): GuessEntry | null {
  return guesses.find((entry) => entry.word === word) ?? guesses.at(-1) ?? null;
}

export function solvedTries(record: GuessRecord): number | null {
  return record.guesses.find((entry) => entry.word === record.answer)?.order ?? null;
}

export function storedDay(value: unknown): number | null {
  const hasDay = isObject(value) && typeof value.day === 'number';
  return hasDay ? Number(value.day) : null;
}

export function latestDay(days: (number | null | undefined)[]): number | null {
  const knownDays = days.filter((day): day is number => typeof day === 'number');
  return knownDays.length > 0 ? Math.max(...knownDays) : null;
}
