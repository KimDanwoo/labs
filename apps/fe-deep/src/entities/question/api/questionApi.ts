import { createClient } from '@shared/api/supabaseClient';
import { toContainsPattern } from '@shared/lib/postgrestFilter';
import { shuffleArray } from '@shared/lib/shuffle';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  Difficulty,
  FollowUp,
  PaginatedResult,
  Question,
  SearchResult,
  VisibilityFilter,
} from '../model/types/types';

// 조회 실패는 호출자에게 전달한다. 정상적인 결과 없음만 빈 배열 또는 undefined로 반환한다.

/** questions 조회 시 공통으로 가져오는 컬럼. 컬럼이 늘면 여기만 고친다. */
const QUESTION_COLUMNS =
  'id, category_id, question, answer, sub_category, difficulty, order_num, tags, show_in_daily, show_in_flashcard, follow_ups';

const CATEGORY_COLUMNS = 'id, slug, title, order_num, icon, description';

type CategoryWithCountRow = Omit<Category, 'question_count'> & { questions: { count: number }[] | null };

type QuestionWithCategoryRow = Omit<Question, 'follow_ups'> & {
  follow_ups: FollowUp[] | null;
  categories: Category | null;
};

/**
 * Supabase 클라이언트를 반환한다.
 * Server Component에서는 createServerSupabaseClient() 결과를 전달하고,
 * Client Component에서는 파라미터 없이 호출하면 브라우저 클라이언트를 생성한다.
 */
function getClient(supabase?: SupabaseClient) {
  return supabase ?? createClient();
}

/** 전체 카테고리 목록을 order_num 순서로 반환한다. 각 카테고리에 question_count를 포함한다. */
export async function getAllCategories(supabase?: SupabaseClient): Promise<Category[]> {
  const client = getClient(supabase);
  const { data, error } = await client
    .from('categories')
    .select(`${CATEGORY_COLUMNS}, questions(count)`)
    .order('order_num')
    .overrideTypes<CategoryWithCountRow[], { merge: false }>();

  if (error) throw error;

  return (data ?? []).map(({ questions, ...category }) => ({
    ...category,
    question_count: questions?.[0]?.count ?? 0,
  }));
}

/** slug로 카테고리를 찾는다. 없으면 undefined를 반환한다. */
export async function getCategoryBySlug(slug: string, supabase?: SupabaseClient): Promise<Category | undefined> {
  const client = getClient(supabase);
  const { data, error } = await client.from('categories').select(CATEGORY_COLUMNS).eq('slug', slug).maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  return data as Category;
}

/** 카테고리 ID에 속하는 질문들을 order_num 순서로 반환한다. */
export async function getQuestionsByCategory(categoryId: string, supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const { data, error } = await client
    .from('questions')
    .select(QUESTION_COLUMNS)
    .eq('category_id', categoryId)
    .order('order_num');

  if (error) throw error;

  return (data ?? []) as Question[];
}

/** 카테고리 slug로 해당 카테고리의 질문들을 반환한다. 카테고리가 없으면 빈 배열. */
export async function getQuestionsByCategorySlug(slug: string, supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const category = await getCategoryBySlug(slug, client);
  if (!category) return [];
  return getQuestionsByCategory(category.id, client);
}

/** 카테고리 slug로 해당 카테고리의 질문들을 페이지네이션하여 반환한다. */
export async function getQuestionsByCategorySlugPaginated(
  slug: string,
  page: number = 1,
  pageSize: number = 10,
  supabase?: SupabaseClient,
  difficulty?: Difficulty,
): Promise<PaginatedResult<Question>> {
  const client = getClient(supabase);
  const category = await getCategoryBySlug(slug, client);
  if (!category) return { data: [], total: 0, page, pageSize, totalPages: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client.from('questions').select(QUESTION_COLUMNS, { count: 'exact' }).eq('category_id', category.id);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, count, error } = await query.order('order_num').range(from, to);

  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data ?? []) as Question[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** 질문 ID로 단일 질문을 찾는다. */
export async function getQuestionById(id: string, supabase?: SupabaseClient): Promise<Question | undefined> {
  const client = getClient(supabase);
  const { data, error } = await client.from('questions').select(QUESTION_COLUMNS).eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  return data as Question;
}

/** 여러 질문 ID로 벌크 조회한다. */
export async function getQuestionsByIds(ids: string[], supabase?: SupabaseClient): Promise<Question[]> {
  if (ids.length === 0) return [];
  const client = getClient(supabase);
  const { data, error } = await client.from('questions').select(QUESTION_COLUMNS).in('id', ids);

  if (error) throw error;

  return (data ?? []) as Question[];
}

/** 전체 질문 목록을 반환한다. */
export async function getAllQuestions(supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const { data, error } = await client.from('questions').select(QUESTION_COLUMNS);

  if (error) throw error;

  return (data ?? []) as Question[];
}

/** 질문·답변·태그 순으로 검색어가 처음 걸리는 곳을 찾는다. */
function findMatchType(question: Question, lowerQuery: string): SearchResult['matchType'] | undefined {
  if (question.question.toLowerCase().includes(lowerQuery)) return 'question';
  if (question.answer.toLowerCase().includes(lowerQuery)) return 'answer';
  if (question.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) return 'tag';
  return undefined;
}

/** 키워드로 질문, 답변을 검색한다. 대소문자를 구분하지 않는다. */
export async function searchQuestions(query: string, supabase?: SupabaseClient): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const client = getClient(supabase);
  const pattern = toContainsPattern(query);

  const { data, error } = await client
    .from('questions')
    .select(`${QUESTION_COLUMNS}, categories(${CATEGORY_COLUMNS})`)
    .or(`question.ilike.${pattern},answer.ilike.${pattern}`)
    .overrideTypes<QuestionWithCategoryRow[], { merge: false }>();

  if (error) throw error;

  const lowerQuery = query.toLowerCase();

  return (data ?? []).flatMap(({ categories: category, follow_ups: followUps, ...row }) => {
    if (!category) return [];
    const question: Question = { ...row, follow_ups: followUps ?? [] };
    const matchType = findMatchType(question, lowerQuery);
    return matchType ? [{ question, category, matchType }] : [];
  });
}

/** 난이도별 질문 목록을 반환한다. */
export async function getQuestionsByDifficulty(difficulty: Difficulty, supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const { data, error } = await client.from('questions').select(QUESTION_COLUMNS).eq('difficulty', difficulty);

  if (error) throw error;

  return (data ?? []) as Question[];
}

/** 랜덤으로 질문을 뽑는다. categorySlug가 주어지면 해당 카테고리에서만 뽑는다. */
export async function getRandomQuestions(
  count: number,
  categorySlug?: string,
  supabase?: SupabaseClient,
  options?: { visibilityFilter?: VisibilityFilter },
): Promise<Question[]> {
  const client = getClient(supabase);

  // 1) ID 목록만 가져온다
  let query = client.from('questions').select('id');
  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug, client);
    if (!category) return [];
    query = query.eq('category_id', category.id);
  }
  if (options?.visibilityFilter === 'daily') {
    query = query.eq('show_in_daily', true);
  } else if (options?.visibilityFilter === 'flashcard') {
    query = query.eq('show_in_flashcard', true);
  }

  const { data: idRows, error: idError } = await query;
  if (idError) throw idError;
  if (!idRows || idRows.length === 0) return [];

  // 2) Fisher-Yates shuffle → pick (균등 분포 보장)
  const pickedIds = shuffleArray(idRows)
    .slice(0, count)
    .map((r) => r.id as string);

  // 3) 벌크 조회
  return getQuestionsByIds(pickedIds, client);
}
