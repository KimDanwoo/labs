'use client';

import { addDays, localDateKey, reviewedDateKey, todayString } from '@entities/progress/lib/progressDates';
import { MASTERED_CORRECT_STREAK, PROGRESS_STATUS, SM2_CONSTANTS } from '@entities/progress/model/constants/constants';
import { getLocalProgress, saveLocalProgress } from '@entities/progress/model/services/progressStorage';
import type { UserProgress } from '@entities/progress/model/types/types';

export function getStudyHeatmap(preloaded?: Record<string, UserProgress>): Record<string, number> {
  const allProgress = preloaded ?? getLocalProgress();
  const heatmap: Record<string, number> = {};

  for (const entry of Object.values(allProgress)) {
    if (!entry.last_reviewed) continue;
    const date = reviewedDateKey(entry.last_reviewed);
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
    if (map[localDateKey(d)]) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

const DEFAULT_EASINESS_FACTOR = 2.5;
const KNEW_REPETITION = 2;

function initialInterval(knew: boolean): number {
  return knew ? SM2_CONSTANTS.INTERVAL_SECOND_REPETITION : SM2_CONSTANTS.INTERVAL_FIRST_REPETITION;
}

function reviewedCounts(existing: UserProgress | undefined, knew: boolean) {
  return {
    correct_count: knew ? (existing?.correct_count ?? 0) + 1 : 0,
    wrong_count: (existing?.wrong_count ?? 0) + (knew ? 0 : 1),
  };
}

function reviewedSchedule(existing: UserProgress | undefined, knew: boolean, today: string) {
  return {
    easiness_factor: existing?.easiness_factor ?? DEFAULT_EASINESS_FACTOR,
    interval: existing?.interval ?? initialInterval(knew),
    repetition: existing?.repetition ?? (knew ? KNEW_REPETITION : 0),
    next_review: existing?.next_review ?? addDays(today, initialInterval(knew)),
  };
}

function reviewedStatus(counts: ReturnType<typeof reviewedCounts>, knew: boolean): UserProgress['status'] {
  if (counts.correct_count >= MASTERED_CORRECT_STREAK) return PROGRESS_STATUS.mastered;
  const hasReviewHistory = counts.correct_count > 0 || counts.wrong_count > 0;
  if (hasReviewHistory) return PROGRESS_STATUS.learning;
  return knew ? PROGRESS_STATUS.mastered : PROGRESS_STATUS.learning;
}

function reviewedProgress(questionId: string, knew: boolean): UserProgress {
  const existing = getLocalProgress()[questionId];
  const today = todayString();
  const counts = reviewedCounts(existing, knew);
  return {
    question_id: questionId,
    status: reviewedStatus(counts, knew),
    ...counts,
    last_reviewed: new Date().toISOString(),
    ...reviewedSchedule(existing, knew, today),
  };
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
    status: PROGRESS_STATUS.mastered,
    correct_count: Math.max(reviewed.correct_count, MASTERED_CORRECT_STREAK),
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
    } else if (progress.status === PROGRESS_STATUS.mastered) {
      mastered++;
    } else {
      learning++;
    }
  }

  return { mastered, learning, unseen };
}
