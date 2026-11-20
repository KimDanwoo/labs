import {
  findCategoryBySlug,
  pickQuestionsByIds,
  questionsInCategory,
  searchQuestionContent,
} from '@entities/question/model/services/questionQueries';
import type { Category, Question, QuestionContent, SearchResult } from '@entities/question/model/types/types';

const QUESTION_CONTENT_PATH = '/api/questions';

let contentRequest: Promise<QuestionContent> | undefined;

function isQuestionContent(value: unknown): value is QuestionContent {
  const isNonNullObject = typeof value === 'object' && value !== null;
  if (!isNonNullObject) return false;
  const { categories, questions } = value as Partial<Record<keyof QuestionContent, unknown>>;
  return Array.isArray(categories) && Array.isArray(questions);
}

async function requestQuestionContent(): Promise<QuestionContent> {
  const response = await fetch(QUESTION_CONTENT_PATH);
  if (!response.ok) throw new Error(`질문 데이터를 불러오지 못했습니다 (${response.status}).`);
  const data: unknown = await response.json();
  if (!isQuestionContent(data)) throw new Error('질문 데이터 형식이 올바르지 않습니다.');
  return data;
}

function fetchQuestionContent(): Promise<QuestionContent> {
  contentRequest ??= requestQuestionContent().catch((error: unknown) => {
    contentRequest = undefined;
    throw error;
  });
  return contentRequest;
}

export async function getAllCategories(): Promise<Category[]> {
  return (await fetchQuestionContent()).categories;
}

export async function getAllQuestions(): Promise<Question[]> {
  return (await fetchQuestionContent()).questions;
}

export async function getQuestionsByCategorySlug(slug: string): Promise<Question[]> {
  const content = await fetchQuestionContent();
  const category = findCategoryBySlug(content, slug);
  return category ? questionsInCategory(content, category.id) : [];
}

export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  return pickQuestionsByIds(await fetchQuestionContent(), ids);
}

export async function searchQuestions(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  return searchQuestionContent(await fetchQuestionContent(), query);
}
