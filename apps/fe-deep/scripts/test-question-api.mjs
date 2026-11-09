import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import test from 'node:test';
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
} from '../src/entities/question/api/questionApi.ts';

const DATABASE_ERROR = { code: '08006', message: 'Database unavailable', details: '', hint: '' };
const FAILURE_RESPONSE = { status: 503, headers: { 'Retry-After': '0' } };
const CATEGORY = {
  id: 'cat-1',
  slug: 'javascript',
  title: 'JavaScript',
  order_num: 1,
  icon: 'JS',
  description: '',
};
const QUESTION = {
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
function database(respond) {
  const requests = [];
  const client = createClient('https://database.example', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input) => {
        const url = new URL(input);
        requests.push(url);
        return respond(url);
      },
    },
  });
  return { client, requests };
}

const listQueries = [
  ['categories', (client) => getAllCategories(client)],
  ['all questions', (client) => getAllQuestions(client)],
  ['questions by category', (client) => getQuestionsByCategory(CATEGORY.id, client)],
  ['questions by IDs', (client) => getQuestionsByIds([QUESTION.id], client)],
  ['questions by difficulty', (client) => getQuestionsByDifficulty('easy', client)],
  ['search', (client) => searchQuestions('JavaScript', client)],
  ['random question IDs', (client) => getRandomQuestions(1, undefined, client)],
];

for (const [name, query] of listQueries) {
  test(`${name}: database failure rejects instead of returning an empty result`, async () => {
    const { client } = database(() => Response.json(DATABASE_ERROR, FAILURE_RESPONSE));
    await assert.rejects(query(client), { code: DATABASE_ERROR.code, message: DATABASE_ERROR.message });
  });

  test(`${name}: a successful empty response remains an empty result`, async () => {
    const { client } = database(() => Response.json([]));
    assert.deepEqual(await query(client), []);
  });
}

for (const [name, query, row] of [
  ['category', (client) => getCategoryBySlug(CATEGORY.slug, client), CATEGORY],
  ['question', (client) => getQuestionById(QUESTION.id, client), QUESTION],
]) {
  test(`${name}: no match returns undefined`, async () => {
    const { client } = database(() => Response.json([]));
    assert.equal(await query(client), undefined);
  });

  test(`${name}: a single match returns the record`, async () => {
    const { client } = database(() => Response.json([row]));
    assert.deepEqual(await query(client), row);
  });

  test(`${name}: database failure rejects`, async () => {
    const { client } = database(() => Response.json(DATABASE_ERROR, FAILURE_RESPONSE));
    await assert.rejects(query(client), { code: DATABASE_ERROR.code });
  });

  test(`${name}: multiple matches reject instead of being treated as missing`, async () => {
    const { client } = database(() => Response.json([row, row]));
    await assert.rejects(query(client), { code: 'PGRST116' });
  });
}

const categoryQueries = [
  ['category questions', (client) => getQuestionsByCategorySlug(CATEGORY.slug, client), []],
  [
    'paginated questions',
    (client) => getQuestionsByCategorySlugPaginated(CATEGORY.slug, 2, 10, client),
    { data: [], total: 0, page: 2, pageSize: 10, totalPages: 0 },
  ],
  ['random category questions', (client) => getRandomQuestions(1, CATEGORY.slug, client), []],
];

for (const [name, query, empty] of categoryQueries) {
  test(`${name}: a missing category returns empty without querying unrelated questions`, async () => {
    const { client, requests } = database(() => Response.json([]));
    assert.deepEqual(await query(client), empty);
    assert.deepEqual(
      requests.map((url) => url.pathname),
      ['/rest/v1/categories'],
    );
  });

  test(`${name}: category lookup failures propagate`, async () => {
    const { client } = database(() => Response.json(DATABASE_ERROR, FAILURE_RESPONSE));
    await assert.rejects(query(client), { code: DATABASE_ERROR.code });
  });

  test(`${name}: question lookup failures propagate`, async () => {
    const { client } = database((url) =>
      url.pathname.endsWith('/categories')
        ? Response.json([CATEGORY])
        : Response.json(DATABASE_ERROR, FAILURE_RESPONSE),
    );
    await assert.rejects(query(client), { code: DATABASE_ERROR.code });
  });
}

test('pagination preserves records, counts and filters on success', async () => {
  const { client, requests } = database((url) =>
    url.pathname.endsWith('/categories')
      ? Response.json([CATEGORY])
      : Response.json([QUESTION], { headers: { 'Content-Range': '10-10/11' } }),
  );
  assert.deepEqual(await getQuestionsByCategorySlugPaginated(CATEGORY.slug, 2, 10, client, 'easy'), {
    data: [QUESTION],
    total: 11,
    page: 2,
    pageSize: 10,
    totalPages: 2,
  });
  const params = requests[1].searchParams;
  assert.equal(params.get('category_id'), `eq.${CATEGORY.id}`);
  assert.equal(params.get('difficulty'), 'eq.easy');
  assert.equal(params.get('offset'), '10');
  assert.equal(params.get('limit'), '10');
});

test('random questions propagate failures from the final bulk lookup', async () => {
  const { client } = database((url) =>
    url.searchParams.get('select') === 'id'
      ? Response.json([{ id: QUESTION.id }])
      : Response.json(DATABASE_ERROR, FAILURE_RESPONSE),
  );
  await assert.rejects(getRandomQuestions(1, undefined, client), { code: DATABASE_ERROR.code });
});

test('random questions preserve category and visibility filters', async () => {
  const { client, requests } = database((url) => {
    if (url.pathname.endsWith('/categories')) return Response.json([CATEGORY]);
    return Response.json(url.searchParams.get('select') === 'id' ? [{ id: QUESTION.id }] : [QUESTION]);
  });
  assert.deepEqual(await getRandomQuestions(1, CATEGORY.slug, client, { visibilityFilter: 'daily' }), [QUESTION]);
  assert.equal(requests[1].searchParams.get('category_id'), `eq.${CATEGORY.id}`);
  assert.equal(requests[1].searchParams.get('show_in_daily'), 'eq.true');
});

test('empty ID lists and blank searches do not access the database', async () => {
  const { client, requests } = database(() => assert.fail('Unexpected database request'));
  assert.deepEqual(await getQuestionsByIds([], client), []);
  assert.deepEqual(await searchQuestions('   ', client), []);
  assert.equal(requests.length, 0);
});
