'use client';

import { STORAGE_KEYS } from '@shared/constants';
import { useTopicMarks } from './useTopicMarks';

const REVIEW_STORE = { table: 'study_review', storageKey: STORAGE_KEYS.STUDY_REVIEW };

/** 오답노트 — 잘 기억나지 않아 다시 볼 주제 표시. */
export function useReviewTopics(docSlug: string) {
  const { marked, isLoaded, toggle } = useTopicMarks(docSlug, REVIEW_STORE);
  return { review: marked, isLoaded, toggle };
}
