import type { Difficulty } from '@entities/question';

export const PHASE = { setup: 'setup', loading: 'loading', study: 'study', done: 'done' } as const;
export type StudyPhase = keyof typeof PHASE;

export const STUDY_ORDER = { sequential: 'sequential', random: 'random' } as const;
export type StudyOrder = keyof typeof STUDY_ORDER;

/** 카테고리를 고르지 않은 상태. 카테고리 slug와 겹치지 않는 값이다. */
export const ALL_CATEGORIES = 'all';

export type StudySettings = {
  categorySlug: string;
  order: StudyOrder;
  /** 포함할 난이도. 빈 배열 = 전체. */
  difficulties: Difficulty[];
};

export const DEFAULT_SETTINGS: StudySettings = {
  categorySlug: ALL_CATEGORIES,
  order: STUDY_ORDER.sequential,
  difficulties: [],
};
