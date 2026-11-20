import { useSearchParams } from 'next/navigation';

import type { Question } from '@entities/question';

import { FIRST_PAGE, LIST_SEARCH_PARAM, QUESTIONS_PER_PAGE } from '@views/reference/config/pagination';
import { toDifficulty } from '@views/reference/lib/toDifficulty';

export function useCategoryPagination(questions: Question[]) {
  const searchParams = useSearchParams();
  const difficulty = toDifficulty(searchParams.get(LIST_SEARCH_PARAM.difficulty));
  const filtered = difficulty ? questions.filter((question) => question.difficulty === difficulty) : questions;
  const totalPages = Math.max(FIRST_PAGE, Math.ceil(filtered.length / QUESTIONS_PER_PAGE));
  const requestedPage = Number(searchParams.get(LIST_SEARCH_PARAM.page)) || FIRST_PAGE;
  const page = Math.min(totalPages, Math.max(FIRST_PAGE, requestedPage));
  const startIndex = (page - FIRST_PAGE) * QUESTIONS_PER_PAGE;
  const pageQuestions = filtered.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  return { difficulty, page, totalPages, startIndex, pageQuestions };
}
