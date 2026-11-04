'use client';

import { STORAGE_KEYS } from '@shared/constants';
import { useTopicMarks } from './useTopicMarks';

const UNDERSTOOD_STORE = { table: 'study_understood', storageKey: STORAGE_KEYS.STUDY_UNDERSTOOD };

/** 이해한 주제 표시. */
export function useUnderstoodTopics(docSlug: string) {
  const { marked, isLoaded, toggle } = useTopicMarks(docSlug, UNDERSTOOD_STORE);
  return { understood: marked, isLoaded, toggle };
}
