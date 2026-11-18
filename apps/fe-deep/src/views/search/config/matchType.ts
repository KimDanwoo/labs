import type { SearchResult } from '@entities/question';

export const MATCH_TYPE_LABEL: Record<SearchResult['matchType'], string> = {
  question: '질문 일치',
  answer: '답변 일치',
  tag: '태그 일치',
};
