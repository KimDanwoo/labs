'use client';

import { queryOptions } from '@tanstack/react-query';
import { getBookmarks, isBookmarked } from '../api';

/** Bookmark 도메인 조회 쿼리 (TanStack Query queryOptions) */
export const bookmarkQueries = {
  all: () =>
    queryOptions({
      queryKey: ['bookmark', 'all'] as const,
      queryFn: () => getBookmarks(),
      staleTime: 0,
    }),

  isBookmarked: (questionId: string) =>
    queryOptions({
      queryKey: ['bookmark', 'isBookmarked', questionId] as const,
      queryFn: () => isBookmarked(questionId),
      staleTime: 0,
    }),
};
