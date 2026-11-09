'use client';

import { SM2_CONSTANTS } from '../constants/constants';
import type { UserProgress } from '../types/types';
import { addDays, todayString } from './progressDates';
import { getLocalProgress, saveLocalProgress } from './progressStorage';
export { getLocalProgress, saveLocalProgress } from './progressStorage';

/**
 * 날짜별 학습 횟수를 집계한다.
 * last_reviewed 필드를 기준으로 날짜(YYYY-MM-DD)별 카운트를 반환한다.
 * preloaded를 넘기면 localStorage 재파싱을 피한다.
 */
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

/**
 * 연속 학습일(streak)을 계산한다.
 * 오늘부터 역순으로 연속된 학습일 수를 반환한다.
 * heatmap을 인자로 받으면 중복 계산을 피할 수 있다.
 */
export function getCurrentStreak(heatmap?: Record<string, number>): number {
  const map = heatmap ?? getStudyHeatmap();
  // Date 객체를 하나만 만들고 재사용하여 GC 부담을 줄인다.
  const d = new Date();
  let streak = 0;

  for (let i = 0; i < SM2_CONSTANTS.STREAK_LOOKBACK_DAYS; i++) {
    if (i > 0) d.setDate(d.getDate() - 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (map[key]) {
      streak++;
    } else {
      // 오늘 아직 학습 안 했으면 어제부터 카운트
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

// ============================================================
// 레퍼런스 페이지 호환 (단순 진도 업데이트)
// ============================================================

/**
 * 질문의 학습 진도를 단순 업데이트한다.
 * 레퍼런스 페이지의 "학습 완료" 버튼에서 사용한다.
 * SM-2 스케줄링 없이 상태만 반영한다.
 */
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
  import('./progressSync')
    .then(({ syncSingleCard }) => {
      syncSingleCard(updated).catch(() => {});
    })
    .catch(() => {});

  return updated;
}

/** 질문 ID에 해당하는 학습 진도를 반환한다. 없으면 null. */
export function getProgressForQuestion(questionId: string): UserProgress | null {
  const allProgress = getLocalProgress();
  return allProgress[questionId] ?? null;
}

/** 주어진 질문 ID 목록에 대한 카테고리별 학습 통계를 계산한다. preloaded를 넘기면 localStorage 재파싱을 피한다. */
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
