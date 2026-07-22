import { getProgressForQuestion, updateQuestionProgress } from '@entities/progress';
import type { ProgressStatus } from '@entities/progress';
import { isBookmarked, toggleBookmark } from '@features/bookmark';

const MASTERED: ProgressStatus = 'mastered';

type QuestionActionState = {
  isBookmarked: boolean;
  status: ProgressStatus | undefined;
};

/**
 * 질문 id별 북마크·진도 상태를 공유하는 외부 스토어.
 * 같은 id를 구독하는 여러 컴포넌트(헤더 완료 표시 · 액션 버튼)가 항상 동기화되도록,
 * 스냅샷 객체는 변경 시에만 새 참조로 교체한다(useSyncExternalStore 요구사항).
 */
const cache = new Map<string, QuestionActionState>();
const listeners = new Map<string, Set<() => void>>();

/** SSR 스냅샷 — 서버에는 localStorage가 없으므로 항상 동일 참조를 반환한다. */
export const SERVER_SNAPSHOT: QuestionActionState = { isBookmarked: false, status: undefined };

function getState(questionId: string): QuestionActionState {
  const cached = cache.get(questionId);
  if (cached) return cached;
  const initial: QuestionActionState = {
    isBookmarked: isBookmarked(questionId),
    status: getProgressForQuestion(questionId)?.status,
  };
  cache.set(questionId, initial);
  return initial;
}

function emit(questionId: string) {
  listeners.get(questionId)?.forEach((listener) => listener());
}

export function subscribe(questionId: string, listener: () => void) {
  let set = listeners.get(questionId);
  if (!set) {
    set = new Set();
    listeners.set(questionId, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

export function getSnapshot(questionId: string): QuestionActionState {
  return getState(questionId);
}

export function isMasteredStatus(status: ProgressStatus | undefined): boolean {
  return status === MASTERED;
}

export function toggleQuestionBookmark(questionId: string) {
  const next = toggleBookmark(questionId);
  cache.set(questionId, { ...getState(questionId), isBookmarked: next });
  emit(questionId);
}

export function markQuestionLearned(questionId: string) {
  updateQuestionProgress(questionId, true);
  cache.set(questionId, { ...getState(questionId), status: MASTERED });
  emit(questionId);
}
