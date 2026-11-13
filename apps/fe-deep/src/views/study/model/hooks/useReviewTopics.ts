'use client';

import { STORAGE_KEYS } from '@shared/config/storageKeys';
import { useTopicMarks } from './useTopicMarks';

const REVIEW_STORE = { table: 'study_review', storageKey: STORAGE_KEYS.STUDY_REVIEW };

export function useReviewTopics(docSlug: string) {
  const { marked, isLoaded, toggle } = useTopicMarks(docSlug, REVIEW_STORE);
  return { review: marked, isLoaded, toggle };
}
