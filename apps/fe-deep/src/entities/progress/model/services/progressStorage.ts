'use client';
import { STORAGE_KEYS } from '@shared/config/storageKeys';
import { todayString } from '../../lib/progressDates';
import { SM2_CONSTANTS } from '../constants/constants';
import type { UserProgress } from '../types/types';

export function getLocalProgress(): Record<string, UserProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!data) return {};
    const parsed = JSON.parse(data) as Record<string, UserProgress>;

    // 기존 데이터에 SM-2 필드가 없으면 마이그레이션 후 저장
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
    id: old.id ?? old.question_id,
    user_id: old.user_id ?? 'local',
    question_id: old.question_id,
    status: old.status ?? 'learning',
    correct_count: old.correct_count ?? 0,
    wrong_count: old.wrong_count ?? 0,
    last_reviewed: old.last_reviewed ?? today,
    easiness_factor: 2.5,
    interval:
      old.status === 'mastered' ? SM2_CONSTANTS.INTERVAL_SECOND_REPETITION : SM2_CONSTANTS.INTERVAL_FIRST_REPETITION,
    repetition: old.status === 'mastered' ? 2 : 0,
    next_review: today, // 마이그레이션 시 오늘 복습 대상으로
  };
}
