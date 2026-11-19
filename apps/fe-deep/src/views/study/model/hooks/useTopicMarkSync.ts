import { useEffect, useMemo, useRef } from 'react';

import type { TopicMarks } from '../services/studyFilter';
import { useReviewTopics } from './useReviewTopics';
import { useUnderstoodTopics } from './useUnderstoodTopics';

export function useTopicMarkSync(docSlug: string) {
  const {
    understood,
    isLoaded: isUnderstoodLoaded,
    toggle: toggleUnderstood,
    remove: removeUnderstood,
  } = useUnderstoodTopics(docSlug);
  const { review, isLoaded: isReviewLoaded, toggle: toggleReview } = useReviewTopics(docSlug);
  const isMarksLoaded = isUnderstoodLoaded && isReviewLoaded;

  // 같은 문서를 연 두 탭에서 따로 표시하면 한 주제가 두 목록에 같이 들어올 수 있다. 다시 볼 주제를 놓치지 않도록 오답노트 쪽을 남긴다.
  const doubleMarkedTopics = useMemo(
    () => (isMarksLoaded ? [...understood].filter((topicTitle) => review.has(topicTitle)) : []),
    [isMarksLoaded, understood, review],
  );
  useEffect(() => {
    if (doubleMarkedTopics.length > 0) removeUnderstood(doubleMarkedTopics);
  }, [doubleMarkedTopics, removeUnderstood]);
  const isLoaded = isMarksLoaded && doubleMarkedTopics.length === 0;

  // 체크 즉시 목록이 훅 바뀌지 않도록, 필터 변경·최초 로드 시점의 스냅샷으로만 목록을 다시 계산한다.
  const marksRef = useRef<TopicMarks>({ understood, review });
  useEffect(() => {
    marksRef.current = { understood, review };
  }, [understood, review]);

  const handleToggleUnderstood = (topicTitle: string) => {
    if (!understood.has(topicTitle) && review.has(topicTitle)) toggleReview(topicTitle);
    toggleUnderstood(topicTitle);
  };

  const handleToggleReview = (topicTitle: string) => {
    if (!review.has(topicTitle) && understood.has(topicTitle)) toggleUnderstood(topicTitle);
    toggleReview(topicTitle);
  };

  return { understood, review, isLoaded, marksRef, handleToggleUnderstood, handleToggleReview };
}
