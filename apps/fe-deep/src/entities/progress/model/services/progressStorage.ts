'use client';
import { STORAGE_KEYS } from '@shared/config/storageKeys';
import { todayString } from '../../lib/progressDates';
import { PROGRESS_STATUS, SM2_CONSTANTS } from '../constants/constants';
import type { UserProgress } from '../types/types';

export function getLocalProgress(): Record<string, UserProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!data) return {};
    const parsed = JSON.parse(data) as Record<string, UserProgress>;

    let needsSave = false;
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry.easiness_factor === undefined) {
        parsed[key] = migrateProgress({ ...entry, question_id: entry.question_id ?? key });
        needsSave = true;
      }
    }
    if (needsSave) {
      saveLocalProgress(parsed);
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveLocalProgress(progress: Record<string, UserProgress>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

function migrateProgress(old: Partial<UserProgress> & { question_id: string }): UserProgress {
  const today = todayString();
  return {
    question_id: old.question_id,
    status: old.status ?? PROGRESS_STATUS.learning,
    correct_count: old.correct_count ?? 0,
    wrong_count: old.wrong_count ?? 0,
    last_reviewed: old.last_reviewed ?? today,
    easiness_factor: 2.5,
    interval:
      old.status === PROGRESS_STATUS.mastered
        ? SM2_CONSTANTS.INTERVAL_SECOND_REPETITION
        : SM2_CONSTANTS.INTERVAL_FIRST_REPETITION,
    repetition: old.status === PROGRESS_STATUS.mastered ? 2 : 0,
    next_review: today,
  };
}
