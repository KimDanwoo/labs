import { getProgressForQuestion, markQuestionMastered, PROGRESS_STATUS, type ProgressStatus } from '@entities/progress';
import { isBookmarked, toggleBookmark } from '@features/bookmark';

type QuestionActionState = {
  isBookmarked: boolean;
  status: ProgressStatus | undefined;
};

const cache = new Map<string, QuestionActionState>();
const listeners = new Map<string, Set<() => void>>();

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

function dropUnwatchedQuestion(questionId: string) {
  listeners.delete(questionId);
  cache.delete(questionId);
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
    if (set.size === 0) dropUnwatchedQuestion(questionId);
  };
}

export function getSnapshot(questionId: string): QuestionActionState {
  return getState(questionId);
}

export function isMasteredStatus(status: ProgressStatus | undefined): boolean {
  return status === PROGRESS_STATUS.mastered;
}

export function toggleQuestionBookmark(questionId: string) {
  const next = toggleBookmark(questionId);
  cache.set(questionId, { ...getState(questionId), isBookmarked: next });
  emit(questionId);
}

export function markQuestionLearned(questionId: string) {
  const { status } = markQuestionMastered(questionId);
  cache.set(questionId, { ...getState(questionId), status });
  emit(questionId);
}
