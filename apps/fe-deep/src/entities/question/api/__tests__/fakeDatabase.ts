import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Category, Question } from '../../model/types/types';

export const DATABASE_ERROR = { code: '08006', message: 'Database unavailable', details: '', hint: '' };
export const FAILURE_RESPONSE = { status: 503, headers: { 'Retry-After': '0' } };

export const CATEGORY: Category = {
  id: 'cat-1',
  slug: 'javascript',
  title: 'JavaScript',
  order_num: 1,
  icon: 'JS',
  description: '',
};

export const QUESTION: Question = {
  id: 'q-1',
  category_id: CATEGORY.id,
  question: 'What is JavaScript?',
  answer: 'A programming language.',
  sub_category: 'basics',
  difficulty: 'easy',
  order_num: 1,
  tags: ['javascript'],
  show_in_daily: true,
  show_in_flashcard: true,
  follow_ups: [],
};

/** 실제 Supabase 쿼리·응답 처리를 사용하고 HTTP 전송만 대체한다. */
export function database(respond: (url: URL) => Response): { client: SupabaseClient; requests: URL[] } {
  const requests: URL[] = [];
  const client = createClient('https://database.example', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input) => {
        const url = new URL(input instanceof Request ? input.url : input);
        requests.push(url);
        return respond(url);
      },
    },
  });
  return { client, requests };
}
