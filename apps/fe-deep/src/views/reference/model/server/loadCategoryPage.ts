import { notFound } from 'next/navigation';

import { findCategoryBySlug, questionsInCategory } from '@entities/question';
import { loadQuestionContent } from '@entities/question/index.server';

import { QUESTIONS_PER_PAGE } from '../../config/pagination';

export async function loadCategoryPage(categorySlug: string) {
  const content = await loadQuestionContent();
  const category = findCategoryBySlug(content, categorySlug);
  if (!category) notFound();

  const questions = questionsInCategory(content, category.id);
  return { category, categories: content.categories, questions, firstPage: questions.slice(0, QUESTIONS_PER_PAGE) };
}
