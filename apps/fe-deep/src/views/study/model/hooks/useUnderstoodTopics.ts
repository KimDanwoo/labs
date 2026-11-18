'use client';

import { STORAGE_KEYS } from '@shared/config/storageKeys';
import { useTopicMarks } from './useTopicMarks';

export function useUnderstoodTopics(docSlug: string) {
  const { marked, isLoaded, toggle, remove } = useTopicMarks(docSlug, STORAGE_KEYS.STUDY_UNDERSTOOD);
  return { understood: marked, isLoaded, toggle, remove };
}
