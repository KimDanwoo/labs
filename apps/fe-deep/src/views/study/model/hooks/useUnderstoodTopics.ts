'use client';

import { STORAGE_KEYS } from '@shared/config/storageKeys';
import { useTopicMarks } from './useTopicMarks';

const UNDERSTOOD_STORE = { table: 'study_understood', storageKey: STORAGE_KEYS.STUDY_UNDERSTOOD };

export function useUnderstoodTopics(docSlug: string) {
  const { marked, isLoaded, toggle } = useTopicMarks(docSlug, UNDERSTOOD_STORE);
  return { understood: marked, isLoaded, toggle };
}
