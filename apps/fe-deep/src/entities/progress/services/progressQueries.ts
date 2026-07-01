'use client';

import { queryOptions } from '@tanstack/react-query';
import {
  getLocalProgress,
  getProgressForQuestion,
  getProgressByCategory,
  getDueCardIds,
  getDueCardCount,
  getStudyHeatmap,
  getCurrentStreak,
} from '../api';

/** Progress 도메인 조회 쿼리 (TanStack Query queryOptions) */
export const progressQueries = {
  localProgress: () =>
    queryOptions({
      queryKey: ['progress', 'local'] as const,
      queryFn: () => getLocalProgress(),
      staleTime: 0,
    }),

  forQuestion: (questionId: string) =>
    queryOptions({
      queryKey: ['progress', 'forQuestion', questionId] as const,
      queryFn: () => getProgressForQuestion(questionId),
      staleTime: 0,
    }),

  byCategory: (questionIds: string[]) =>
    queryOptions({
      queryKey: ['progress', 'byCategory', questionIds] as const,
      queryFn: () => getProgressByCategory(questionIds),
      staleTime: 0,
    }),

  dueCardIds: () =>
    queryOptions({
      queryKey: ['progress', 'dueCardIds'] as const,
      queryFn: () => getDueCardIds(),
      staleTime: 0,
    }),

  dueCardCount: () =>
    queryOptions({
      queryKey: ['progress', 'dueCardCount'] as const,
      queryFn: () => getDueCardCount(),
      staleTime: 0,
    }),

  studyHeatmap: () =>
    queryOptions({
      queryKey: ['progress', 'studyHeatmap'] as const,
      queryFn: () => getStudyHeatmap(),
      staleTime: 0,
    }),

  currentStreak: () =>
    queryOptions({
      queryKey: ['progress', 'currentStreak'] as const,
      queryFn: () => getCurrentStreak(),
      staleTime: 0,
    }),
};
