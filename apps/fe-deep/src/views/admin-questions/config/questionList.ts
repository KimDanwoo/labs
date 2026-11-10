import type { Difficulty, QuestionVisibilityField } from '@entities/question';

export const PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;

/** 필터를 걸지 않은 상태. URL에는 싣지 않는다. */
export const FILTER_ALL = 'all';

export const VISIBILITY_FIELD = {
  daily: 'show_in_daily',
  flashcard: 'show_in_flashcard',
} as const satisfies Record<string, QuestionVisibilityField>;

export const VISIBILITY_LABEL: Record<QuestionVisibilityField, string> = {
  show_in_daily: '오늘학습',
  show_in_flashcard: '플래시카드',
};

export const DIFFICULTY_FILTER_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
