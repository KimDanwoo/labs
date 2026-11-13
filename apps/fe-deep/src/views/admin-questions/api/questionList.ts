import type { Question } from '@entities/question';
import { createClient } from '@shared/api/supabaseClient';
import { toContainsPattern, toSingleItemArray } from '@shared/lib/postgrestFilter';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FILTER_ALL, PAGE_SIZE } from '../config/questionList';

const LIST_COLUMNS =
  'id, category_id, question, answer, sub_category, difficulty, order_num, tags, show_in_daily, show_in_flashcard';

export type QuestionListItem = Omit<Question, 'follow_ups'>;

export type QuestionListQuery = {
  page: number;
  categoryId: string;
  difficulty: string;
  search: string;
};

export type QuestionListPage = {
  questions: QuestionListItem[];
  totalCount: number;
};

export async function fetchQuestionList(
  { page, categoryId, difficulty, search }: QuestionListQuery,
  signal: AbortSignal,
  client: SupabaseClient = createClient(),
): Promise<QuestionListPage> {
  let query = client.from('questions').select(LIST_COLUMNS, { count: 'exact' }).order('order_num');

  if (categoryId !== FILTER_ALL) query = query.eq('category_id', categoryId);
  if (difficulty !== FILTER_ALL) query = query.eq('difficulty', difficulty);
  if (search) query = query.or(`question.ilike.${toContainsPattern(search)},tags.cs.${toSingleItemArray(search)}`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .range(from, from + PAGE_SIZE - 1)
    .abortSignal(signal)
    .overrideTypes<QuestionListItem[], { merge: false }>();

  if (error) throw error;
  return { questions: data ?? [], totalCount: count ?? 0 };
}
