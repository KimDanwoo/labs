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

const MASTERED_CORRECT_COUNT = 3;

function reviewedProgress(questionId: string, knew: boolean): UserProgress {
  const existing = getLocalProgress()[questionId];
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

  if (updated.correct_count >= MASTERED_CORRECT_COUNT) {
    updated.status = 'mastered';
  } else if (updated.correct_count > 0 || updated.wrong_count > 0) {
    updated.status = 'learning';
  }

  return updated;
}

function saveQuestionProgress(updated: UserProgress): UserProgress {
  saveLocalProgress({ ...getLocalProgress(), [updated.question_id]: updated });
  return updated;
}

export function updateQuestionProgress(questionId: string, knew: boolean): UserProgress {
  return saveQuestionProgress(reviewedProgress(questionId, knew));
}

export function markQuestionMastered(questionId: string): UserProgress {
  const reviewed = reviewedProgress(questionId, true);
  return saveQuestionProgress({
    ...reviewed,
    status: 'mastered',
    correct_count: Math.max(reviewed.correct_count, MASTERED_CORRECT_COUNT),
  });
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
