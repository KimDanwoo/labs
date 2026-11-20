import { PROGRESS_STATUS, SM2_CONSTANTS } from '@entities/progress/model/constants/constants';
import type { ProgressStatus, UserProgress } from '@entities/progress/model/types/types';

export interface StoredProgress {
  progress: Record<string, UserProgress>;
  isRepaired: boolean;
}

const PROGRESS_STATUSES: readonly string[] = Object.values(PROGRESS_STATUS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function isProgressStatus(value: unknown): value is ProgressStatus {
  return typeof value === 'string' && PROGRESS_STATUSES.includes(value);
}

export function normalizeProgress(key: string, entry: Record<string, unknown>, today: string): UserProgress {
  const status = isProgressStatus(entry.status) ? entry.status : PROGRESS_STATUS.learning;
  const isMastered = status === PROGRESS_STATUS.mastered;
  const firstInterval = isMastered ? SM2_CONSTANTS.INTERVAL_SECOND_REPETITION : SM2_CONSTANTS.INTERVAL_FIRST_REPETITION;
  return {
    question_id: stringOr(entry.question_id, key),
    status,
    correct_count: numberOr(entry.correct_count, 0),
    wrong_count: numberOr(entry.wrong_count, 0),
    last_reviewed: stringOr(entry.last_reviewed, today),
    easiness_factor: numberOr(entry.easiness_factor, SM2_CONSTANTS.DEFAULT_EASINESS_FACTOR),
    interval: numberOr(entry.interval, firstInterval),
    repetition: numberOr(entry.repetition, isMastered ? SM2_CONSTANTS.MASTERED_REPETITION : 0),
    next_review: stringOr(entry.next_review, today),
  };
}

function isSameEntry(normalized: UserProgress, entry: Record<string, unknown>) {
  const keys = Object.keys(normalized);
  if (Object.keys(entry).length !== keys.length) return false;
  return Object.entries(normalized).every(([field, value]) => entry[field] === value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parseStoredProgress(raw: string | null, today: string): StoredProgress {
  const parsed = raw ? parseJson(raw) : null;
  if (!isRecord(parsed)) return { progress: {}, isRepaired: false };

  const progress: Record<string, UserProgress> = {};
  let isRepaired = false;
  for (const [key, entry] of Object.entries(parsed)) {
    if (!isRecord(entry)) {
      isRepaired = true;
      continue;
    }
    const normalized = normalizeProgress(key, entry, today);
    if (!isSameEntry(normalized, entry)) isRepaired = true;
    progress[key] = normalized;
  }
  return { progress, isRepaired };
}
