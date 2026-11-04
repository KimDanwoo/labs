import type { Difficulty } from '@entities/question/model/types';
import { queryOptions } from '@tanstack/react-query';
import {
  getAllCategories,
  getAllQuestions,
  getCategoryBySlug,
  getQuestionById,
  getQuestionsByCategory,
  getQuestionsByCategorySlug,
  getQuestionsByCategorySlugPaginated,
  getQuestionsByDifficulty,
  getQuestionsByIds,
  getRandomQuestions,
  searchQuestions,
} from './questionApi';

/** Question 도메인 조회 쿼리 (TanStack Query queryOptions) */
export const questionQueries = {
  allCategories: () =>
    queryOptions({
      queryKey: ['question', 'categories'] as const,
      queryFn: () => getAllCategories(),
    }),

  categoryBySlug: (slug: string) =>
    queryOptions({
      queryKey: ['question', 'category', slug] as const,
      queryFn: async () => (await getCategoryBySlug(slug)) ?? null,
    }),

  byCategory: (categoryId: string) =>
    queryOptions({
      queryKey: ['question', 'byCategory', categoryId] as const,
      queryFn: () => getQuestionsByCategory(categoryId),
    }),

  byCategorySlug: (slug: string) =>
    queryOptions({
      queryKey: ['question', 'byCategorySlug', slug] as const,
      queryFn: () => getQuestionsByCategorySlug(slug),
    }),

  byCategorySlugPaginated: (slug: string, page: number, pageSize: number) =>
    queryOptions({
      queryKey: ['question', 'byCategorySlugPaginated', slug, page, pageSize] as const,
      queryFn: () => getQuestionsByCategorySlugPaginated(slug, page, pageSize),
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: ['question', 'byId', id] as const,
      queryFn: async () => (await getQuestionById(id)) ?? null,
      enabled: !!id,
    }),

  byIds: (ids: string[]) =>
    queryOptions({
      queryKey: ['question', 'byIds', ids] as const,
      queryFn: () => getQuestionsByIds(ids),
      enabled: ids.length > 0,
    }),

  all: () =>
    queryOptions({
      queryKey: ['question', 'all'] as const,
      queryFn: () => getAllQuestions(),
    }),

  search: (query: string) =>
    queryOptions({
      queryKey: ['question', 'search', query] as const,
      queryFn: () => searchQuestions(query),
      enabled: query.trim().length > 0,
    }),

  byDifficulty: (difficulty: Difficulty) =>
    queryOptions({
      queryKey: ['question', 'byDifficulty', difficulty] as const,
      queryFn: () => getQuestionsByDifficulty(difficulty),
    }),

  random: (count: number, categorySlug?: string) =>
    queryOptions({
      queryKey: ['question', 'random', count, categorySlug] as const,
      queryFn: () => getRandomQuestions(count, categorySlug),
    }),
};
