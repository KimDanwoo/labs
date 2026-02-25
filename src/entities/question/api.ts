import { createClient } from '@/shared/config/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { shuffleArray } from '@/shared/lib/shuffle';
import type { Category, Question, PaginatedResult, SearchResult } from './model';

// ============================================================
// Supabase data access layer
// ============================================================

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
    .select('id, slug, title, order_num, icon, description, questions(count)')
    .order('order_num');

  if (error) {
    console.error('getAllCategories error:', error);
    return [];
  }

  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    slug: c.slug as string,
    title: c.title as string,
    order_num: c.order_num as number,
    icon: c.icon as string,
    description: c.description as string,
    question_count: (c.questions as { count: number }[])?.[0]?.count ?? 0,
  }));
}

/** slug로 카테고리를 찾는다. 없으면 undefined를 반환한다. */
export async function getCategoryBySlug(slug: string, supabase?: SupabaseClient): Promise<Category | undefined> {
  const client = getClient(supabase);
  const { data, error } = await client
    .from('categories')
    .select('id, slug, title, order_num, icon, description')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') console.error('getCategoryBySlug error:', error);
    return undefined;
  }

  return data as Category;
}

/** 카테고리 ID에 속하는 질문들을 order_num 순서로 반환한다. */
export async function getQuestionsByCategory(categoryId: string, supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const { data, error } = await client
    .from('questions')
    .select('id, category_id, question, answer, sub_category, difficulty, order_num, tags')
    .eq('category_id', categoryId)
    .order('order_num');

  if (error) {
    console.error('getQuestionsByCategory error:', error);
    return [];
  }

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
  supabase?: SupabaseClient
): Promise<PaginatedResult<Question>> {
  const client = getClient(supabase);
  const category = await getCategoryBySlug(slug, client);
  if (!category) return { data: [], total: 0, page, pageSize, totalPages: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await client
    .from('questions')
    .select('id, category_id, question, answer, sub_category, difficulty, order_num, tags', { count: 'exact' })
    .eq('category_id', category.id)
    .order('order_num')
    .range(from, to);

  if (error) {
    console.error('getQuestionsByCategorySlugPaginated error:', error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

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
  const { data, error } = await client
    .from('questions')
    .select('id, category_id, question, answer, sub_category, difficulty, order_num, tags')
    .eq('id', id)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') console.error('getQuestionById error:', error);
    return undefined;
  }

  return data as Question;
}

/** 여러 질문 ID로 벌크 조회한다. */
export async function getQuestionsByIds(ids: string[], supabase?: SupabaseClient): Promise<Question[]> {
  if (ids.length === 0) return [];
  const client = getClient(supabase);
  const { data, error } = await client
    .from('questions')
    .select('id, category_id, question, answer, sub_category, difficulty, order_num, tags')
    .in('id', ids);

  if (error) {
    console.error('getQuestionsByIds error:', error);
    return [];
  }

  return (data ?? []) as Question[];
}

/** 전체 질문 목록을 반환한다. */
export async function getAllQuestions(supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const { data, error } = await client
    .from('questions')
    .select('id, category_id, question, answer, sub_category, difficulty, order_num, tags');

  if (error) {
    console.error('getAllQuestions error:', error);
    return [];
  }

  return (data ?? []) as Question[];
}

/** 키워드로 질문, 답변을 검색한다. 대소문자를 구분하지 않는다. */
export async function searchQuestions(query: string, supabase?: SupabaseClient): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const client = getClient(supabase);
  // ILIKE 특수문자(%_\)를 이스케이프하여 리터럴 검색이 되도록 한다.
  const escaped = query.replace(/[%_\\]/g, '\\$&');
  const pattern = `%${escaped}%`;

  const { data, error } = await client
    .from('questions')
    .select(`
      id, category_id, question, answer, sub_category, difficulty, order_num, tags,
      categories(id, slug, title, order_num, icon, description)
    `)
    .or(`question.ilike.${pattern},answer.ilike.${pattern}`);

  if (error) {
    console.error('searchQuestions error:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const row of data) {
    const category = row.categories as unknown as Category;
    if (!category) continue;

    const q: Question = {
      id: row.id as string,
      category_id: row.category_id as string,
      question: row.question as string,
      answer: row.answer as string,
      sub_category: row.sub_category as string,
      difficulty: row.difficulty as Question['difficulty'],
      order_num: row.order_num as number,
      tags: row.tags as string[],
    };

    if (q.question.toLowerCase().includes(lowerQuery)) {
      results.push({ question: q, category, matchType: 'question' });
    } else if (q.answer.toLowerCase().includes(lowerQuery)) {
      results.push({ question: q, category, matchType: 'answer' });
    } else if (q.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      results.push({ question: q, category, matchType: 'tag' });
    }
  }

  return results;
}

/** 난이도별 질문 목록을 반환한다. */
export async function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard', supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);
  const { data, error } = await client
    .from('questions')
    .select('id, category_id, question, answer, sub_category, difficulty, order_num, tags')
    .eq('difficulty', difficulty);

  if (error) {
    console.error('getQuestionsByDifficulty error:', error);
    return [];
  }

  return (data ?? []) as Question[];
}

/** 랜덤으로 질문을 뽑는다. categorySlug가 주어지면 해당 카테고리에서만 뽑는다. */
export async function getRandomQuestions(count: number, categorySlug?: string, supabase?: SupabaseClient): Promise<Question[]> {
  const client = getClient(supabase);

  // 1) ID 목록만 가져온다
  let query = client.from('questions').select('id');
  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug, client);
    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  const { data: idRows, error: idError } = await query;
  if (idError || !idRows || idRows.length === 0) {
    if (idError) console.error('getRandomQuestions id fetch error:', idError);
    return [];
  }

  // 2) Fisher-Yates shuffle → pick (균등 분포 보장)
  const pickedIds = shuffleArray(idRows).slice(0, count).map((r) => r.id as string);

  // 3) 벌크 조회
  return getQuestionsByIds(pickedIds, client);
}
