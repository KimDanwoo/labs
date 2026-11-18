import { STUDY_FILTER, STUDY_TIER, type StudyFilter, type StudyTier } from '../model/services/studyFilter';

export const STUDY_SEARCH_PARAM = { tier: 'tier', filter: 'filter' } as const;

export const FILTER_LABELS: Record<StudyFilter, string> = {
  [STUDY_FILTER.all]: '전체',
  [STUDY_FILTER.todo]: '이해 안 됨',
  [STUDY_FILTER.done]: '이해됨',
  [STUDY_FILTER.review]: '오답노트',
};

export const FILTER_ORDER: readonly StudyFilter[] = [
  STUDY_FILTER.all,
  STUDY_FILTER.todo,
  STUDY_FILTER.done,
  STUDY_FILTER.review,
];

export const TIER_LABELS: Record<StudyTier, string> = {
  [STUDY_TIER.a]: 'A',
  [STUDY_TIER.b]: 'B',
  [STUDY_TIER.c]: 'C',
};

export const EMPTY_MESSAGES: Record<StudyFilter, string> = {
  [STUDY_FILTER.all]: '해당하는 주제가 없습니다.',
  [STUDY_FILTER.todo]: '남은 주제가 없습니다. 전부 이해했습니다 🎉',
  [STUDY_FILTER.done]: '아직 이해됨으로 표시한 주제가 없습니다.',
  [STUDY_FILTER.review]: '오답노트가 비어 있습니다. 기억이 흐릿한 주제를 담아두세요.',
};
