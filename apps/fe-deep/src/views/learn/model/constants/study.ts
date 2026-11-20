import type { Difficulty } from '@entities/question';

export const PHASE = { setup: 'setup', loading: 'loading', study: 'study', done: 'done' } as const;
export type StudyPhase = keyof typeof PHASE;

export const STUDY_ORDER = { sequential: 'sequential', random: 'random' } as const;
export type StudyOrder = keyof typeof STUDY_ORDER;

export const ALL_CATEGORIES = 'all';

export type StudySettings = {
  categorySlug: string;
  order: StudyOrder;
  difficulties: Difficulty[];
};

export const DEFAULT_SETTINGS: StudySettings = {
  categorySlug: ALL_CATEGORIES,
  order: STUDY_ORDER.sequential,
  difficulties: [],
};
