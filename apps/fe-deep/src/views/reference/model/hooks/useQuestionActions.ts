'use client';

import {
  SERVER_SNAPSHOT,
  getSnapshot,
  isMasteredStatus,
  markQuestionLearned,
  subscribe,
  toggleQuestionBookmark,
} from '@views/reference/model/store/questionActionsStore';
import { useCallback, useSyncExternalStore } from 'react';

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
