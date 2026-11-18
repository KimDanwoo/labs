'use client';

import { STORAGE_KEYS } from '@shared/config/storageKeys';
import { useTopicMarks } from './useTopicMarks';

export function useReviewTopics(docSlug: string) {
  const { marked, isLoaded, toggle } = useTopicMarks(docSlug, STORAGE_KEYS.STUDY_REVIEW);
  return { review: marked, isLoaded, toggle };
}
