'use client';

import type { ProgressStatus, UserProgress, ReviewRating } from '../model';
import { calculateSM2, todayString, addDays } from '../sm2';

export { calculateSM2 } from '../sm2';

const PROGRESS_KEY = 'fe-interview-progress';

// ============================================================
// LocalStorage CRUD
// ============================================================

/** localStorage에서 전체 학습 진도 데이터를 읽는다. SSR 환경에서는 빈 객체를 반환한다. */
export function getLocalProgress(): Record<string, UserProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
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

/** 학습 진도 데이터를 localStorage에 저장한다. */
export function saveLocalProgress(progress: Record<string, UserProgress>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/** SM-2 필드가 없는 기존 progress를 마이그레이션한다. */
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
    interval: old.status === 'mastered' ? 6 : 1,
    repetition: old.status === 'mastered' ? 2 : 0,
    next_review: today, // 마이그레이션 시 오늘 복습 대상으로
  };
}

// ============================================================
// 플래시카드 복습 (SM-2 기반)
// ============================================================

/**
 * SM-2 평가 결과로 카드의 학습 진도를 업데이트한다.
 * 플래시카드 학습에서 사용한다.
 */
export function reviewCard(questionId: string, rating: ReviewRating): UserProgress {
  const allProgress = getLocalProgress();
  const existing = allProgress[questionId];

  const prevEF = existing?.easiness_factor ?? 2.5;
  const prevInterval = existing?.interval ?? 0;
  const prevRepetition = existing?.repetition ?? 0;

  const sm2 = calculateSM2(prevEF, prevInterval, prevRepetition, rating);
  const isCorrect = rating !== 'again';

  // status 결정: repetition 3+ → mastered, 그 외 → learning
  let status: ProgressStatus = 'learning';
  if (sm2.repetition >= 3) {
    status = 'mastered';
  }

  const updated: UserProgress = {
    id: existing?.id ?? questionId,
    user_id: existing?.user_id ?? 'local',
    question_id: questionId,
    status,
    correct_count: (existing?.correct_count ?? 0) + (isCorrect ? 1 : 0),
    wrong_count: (existing?.wrong_count ?? 0) + (isCorrect ? 0 : 1),
    last_reviewed: new Date().toISOString(),
    easiness_factor: sm2.easiness_factor,
    interval: sm2.interval,
    repetition: sm2.repetition,
    next_review: sm2.next_review,
  };

  allProgress[questionId] = updated;
  saveLocalProgress(allProgress);

  // Supabase write-through (lazy import로 순환 의존성 방지)
  import('../services/progressSync').then(({ syncSingleCard }) => {
    syncSingleCard(updated).catch(() => {});
  }).catch(() => {});

  return updated;
}

/**
 * 오늘 복습해야 할 카드의 question ID 목록을 반환한다.
 * next_review가 오늘 이전인 카드들을 선택한다.
 */
export function getDueCardIds(): string[] {
  const allProgress = getLocalProgress();
  const today = todayString();

  return Object.values(allProgress)
    .filter((p) => p.next_review <= today)
    .sort((a, b) => a.next_review.localeCompare(b.next_review))
    .map((p) => p.question_id);
}

/**
 * 복습 대기 카드 수를 반환한다.
 * getDueCardIds()와 달리 정렬 없이 카운트만 반환하므로 더 빠르다.
 * preloaded를 넘기면 localStorage 재파싱을 피한다.
 */
export function getDueCardCount(preloaded?: Record<string, UserProgress>): number {
  const allProgress = preloaded ?? getLocalProgress();
  const today = todayString();
  let count = 0;
  for (const p of Object.values(allProgress)) {
    if (p.next_review <= today) count++;
  }
  return count;
}

// ============================================================
// 학습 히트맵 (날짜별 학습량 집계)
// ============================================================

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
    const date = entry.last_reviewed.split('T')[0];
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

  for (let i = 0; i < 365; i++) {
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
export function updateQuestionProgress(
  questionId: string,
  knew: boolean
): UserProgress {
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
    interval: existing?.interval ?? (knew ? 6 : 1),
    repetition: existing?.repetition ?? (knew ? 2 : 0),
    next_review: existing?.next_review ?? addDays(today, knew ? 6 : 1),
  };

  if (updated.correct_count >= 3) {
    updated.status = 'mastered';
  } else if (updated.correct_count > 0 || updated.wrong_count > 0) {
    updated.status = 'learning';
  }

  allProgress[questionId] = updated;
  saveLocalProgress(allProgress);

  // Supabase write-through (lazy import로 순환 의존성 방지)
  import('../services/progressSync').then(({ syncSingleCard }) => {
    syncSingleCard(updated).catch(() => {});
  }).catch(() => {});

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
