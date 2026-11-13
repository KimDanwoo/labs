'use client';

import { addDays, todayString } from '../../lib/progressDates';
import { SM2_CONSTANTS } from '../constants/constants';
import type { UserProgress } from '../types/types';
import { getLocalProgress, saveLocalProgress } from './progressStorage';
export { getLocalProgress, saveLocalProgress } from './progressStorage';

export function getStudyHeatmap(preloaded?: Record<string, UserProgress>): Record<string, number> {
  const allProgress = preloaded ?? getLocalProgress();
  const heatmap: Record<string, number> = {};

  for (const entry of Object.values(allProgress)) {
    if (!entry.last_reviewed) continue;
    const [date] = entry.last_reviewed.split('T');
    if (!date) continue;
    heatmap[date] = (heatmap[date] ?? 0) + 1;
  }

  return heatmap;
}

export function getCurrentStreak(heatmap?: Record<string, number>): number {
  const map = heatmap ?? getStudyHeatmap();
  const d = new Date();
  let streak = 0;

  for (let i = 0; i < SM2_CONSTANTS.STREAK_LOOKBACK_DAYS; i++) {
    if (i > 0) d.setDate(d.getDate() - 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (map[key]) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

export function updateQuestionProgress(questionId: string, knew: boolean): UserProgress {
  const allProgress = getLocalProgress();
  const existing = allProgress[questionId];
  const today = todayString();

  const updated: UserProgress = {
    id: existing?.id ?? questionId,
    user_id: existing?.user_id ?? 'local',
    question_id: questionId,
    status: knew ? 'mastered' : 'learning',
    correct_count: (existing?.correct_count ?? 0) + (knew ? 1 : 0),
    wrong_count: (existing?.wrong_count ?? 0) + (knew ? 0 : 1),
    last_reviewed: new Date().toISOString(),
    easiness_factor: existing?.easiness_factor ?? 2.5,
    interval:
      existing?.interval ?? (knew ? SM2_CONSTANTS.INTERVAL_SECOND_REPETITION : SM2_CONSTANTS.INTERVAL_FIRST_REPETITION),
    repetition: existing?.repetition ?? (knew ? 2 : 0),
    next_review:
      existing?.next_review ??
      addDays(today, knew ? SM2_CONSTANTS.INTERVAL_SECOND_REPETITION : SM2_CONSTANTS.INTERVAL_FIRST_REPETITION),
  };

  if (updated.correct_count >= 3) {
    updated.status = 'mastered';
  } else if (updated.correct_count > 0 || updated.wrong_count > 0) {
    updated.status = 'learning';
  }

  allProgress[questionId] = updated;
  saveLocalProgress(allProgress);

  // Supabase write-through (lazy import로 순환 의존성 방지)
  import('../../api/progressSync')
    .then(({ syncSingleCard }) => {
      syncSingleCard(updated).catch(() => {});
    })
    .catch(() => {});

  return updated;
}

export function getProgressForQuestion(questionId: string): UserProgress | null {
  const allProgress = getLocalProgress();
  return allProgress[questionId] ?? null;
}

export function getProgressByCategory(
  categoryQuestionIds: string[],
  preloaded?: Record<string, UserProgress>,
): {
  mastered: number;
  learning: number;
  unseen: number;
} {
  const allProgress = preloaded ?? getLocalProgress();
  let mastered = 0;
  let learning = 0;
  let unseen = 0;

  for (const qId of categoryQuestionIds) {
    const progress = allProgress[qId];
    if (!progress) {
      unseen++;
    } else if (progress.status === 'mastered') {
      mastered++;
    } else {
      learning++;
    }
  }

  return { mastered, learning, unseen };
}
