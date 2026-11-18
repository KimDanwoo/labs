import type { Difficulty } from '@entities/question';

import { FIRST_PAGE, LIST_SEARCH_PARAM } from '../config/pagination';
import { categoryHref } from './categoryHref';

export function buildListHref(categorySlug: string, page: number, difficulty?: Difficulty): string {
  const query = new URLSearchParams();
  if (page > FIRST_PAGE) query.set(LIST_SEARCH_PARAM.page, String(page));
  if (difficulty) query.set(LIST_SEARCH_PARAM.difficulty, difficulty);
  const queryString = query.toString();
  return `${categoryHref(categorySlug)}${queryString ? `?${queryString}` : ''}`;
}
