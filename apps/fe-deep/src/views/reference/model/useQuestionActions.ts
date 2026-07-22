'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  SERVER_SNAPSHOT,
  getSnapshot,
  isMasteredStatus,
  markQuestionLearned,
  subscribe,
  toggleQuestionBookmark,
} from './questionActionsStore';

/**
 * 질문 1개의 북마크·학습완료 상태를 직접 구독하고 실행한다.
 * 같은 id를 구독하는 컴포넌트끼리 공유 스토어로 자동 동기화된다.
 */
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
