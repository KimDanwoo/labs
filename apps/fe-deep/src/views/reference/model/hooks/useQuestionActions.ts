'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  SERVER_SNAPSHOT,
  getSnapshot,
  isMasteredStatus,
  markQuestionLearned,
  subscribe,
  toggleQuestionBookmark,
} from '../store/questionActionsStore';

export function useQuestionActions(questionId: string) {
  const state = useSyncExternalStore(
    useCallback((listener) => subscribe(questionId, listener), [questionId]),
    useCallback(() => getSnapshot(questionId), [questionId]),
    () => SERVER_SNAPSHOT,
  );

  const handleBookmarkToggle = useCallback(() => toggleQuestionBookmark(questionId), [questionId]);
  const handleMarkLearned = useCallback(() => markQuestionLearned(questionId), [questionId]);

  return {
    isBookmarked: state.isBookmarked,
    isMastered: isMasteredStatus(state.status),
    handleBookmarkToggle,
    handleMarkLearned,
  };
}
