import type { Category, Question, QuestionContent, SearchResult } from '../types/types';

export function findCategoryBySlug(content: QuestionContent, slug: string): Category | undefined {
  return content.categories.find((category) => category.slug === slug);
}

export function questionsInCategory(content: QuestionContent, categoryId: string): Question[] {
  return content.questions
    .filter((question) => question.category_id === categoryId)
    .sort((a, b) => a.order_num - b.order_num);
}

export function pickQuestionsByIds(content: QuestionContent, ids: string[]): Question[] {
  const wanted = new Set(ids);
  return content.questions.filter((question) => wanted.has(question.id));
}

function findMatchType(question: Question, lowerQuery: string): SearchResult['matchType'] | undefined {
  if (question.question.toLowerCase().includes(lowerQuery)) return 'question';
  if (question.answer.toLowerCase().includes(lowerQuery)) return 'answer';
  if (question.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) return 'tag';
  return undefined;
}

export function searchQuestionContent(content: QuestionContent, query: string): SearchResult[] {
  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) return [];

  const categoryById = new Map(content.categories.map((category) => [category.id, category]));
  return content.questions.flatMap((question) => {
    const category = categoryById.get(question.category_id);
    const matchType = findMatchType(question, lowerQuery);
    return category && matchType ? [{ question, category, matchType }] : [];
  });
}
