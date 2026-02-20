'use client';

import type { ProgressStatus, UserProgress, FlashcardResult } from './model';

const PROGRESS_KEY = 'fe-interview-progress';

// ============================================================
// LocalStorage-based progress tracking
// When logged in, syncs to Supabase; otherwise persists locally
// ============================================================

/** localStorage에서 전체 학습 진도 데이터를 읽는다. SSR 환경에서는 빈 객체를 반환한다. */
export function getLocalProgress(): Record<string, UserProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/** 학습 진도 데이터를 localStorage에 저장한다. */
export function saveLocalProgress(progress: Record<string, UserProgress>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/** 질문의 학습 진도를 업데이트한다. 정답 3회 이상이면 mastered로 전환한다. */
export function updateQuestionProgress(
  questionId: string,
  knew: boolean
): UserProgress {
  const allProgress = getLocalProgress();
  const existing = allProgress[questionId];

  const updated: UserProgress = {
    id: existing?.id ?? questionId,
    user_id: existing?.user_id ?? 'local',
    question_id: questionId,
    status: knew ? 'mastered' : 'learning',
    correct_count: (existing?.correct_count ?? 0) + (knew ? 1 : 0),
    wrong_count: (existing?.wrong_count ?? 0) + (knew ? 0 : 1),
    last_reviewed: new Date().toISOString(),
  };

  // Status logic: 3+ correct → mastered, otherwise learning
  if (updated.correct_count >= 3) {
    updated.status = 'mastered';
  } else if (updated.correct_count > 0 || updated.wrong_count > 0) {
    updated.status = 'learning';
  }

  allProgress[questionId] = updated;
  saveLocalProgress(allProgress);
  return updated;
}

/** 질문 ID에 해당하는 학습 진도를 반환한다. 없으면 null. */
export function getProgressForQuestion(questionId: string): UserProgress | null {
  const allProgress = getLocalProgress();
  return allProgress[questionId] ?? null;
}

/** 전체 학습 통계(total, mastered, learning, unseen)를 계산한다. */
export function getProgressStats() {
  const allProgress = getLocalProgress();
  const entries = Object.values(allProgress);

  return {
    total: entries.length,
    mastered: entries.filter((p) => p.status === 'mastered').length,
    learning: entries.filter((p) => p.status === 'learning').length,
    unseen: 0, // computed from total questions - total progress entries
  };
}

/** 주어진 질문 ID 목록에 대한 카테고리별 학습 통계를 계산한다. */
export function getProgressByCategory(categoryQuestionIds: string[]): {
  mastered: number;
  learning: number;
  unseen: number;
} {
  const allProgress = getLocalProgress();
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

/** 플래시카드 결과 목록을 일괄 처리하여 학습 진도에 반영한다. */
export function processFlashcardResults(results: FlashcardResult[]) {
  for (const result of results) {
    updateQuestionProgress(result.questionId, result.knew);
  }
}
