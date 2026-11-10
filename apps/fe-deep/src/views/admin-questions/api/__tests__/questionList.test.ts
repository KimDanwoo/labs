import { CATEGORY, database } from '@entities/question/api/__tests__/fakeDatabase';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchQuestionList } from '../questionList';

test('admin list keeps filter syntax characters in the keyword literal', async () => {
  const { client, requests } = database(() => Response.json([], { headers: { 'Content-Range': '*/0' } }));
  const query = { page: 2, categoryId: CATEGORY.id, difficulty: 'all', search: String.raw`a,b(c){d}"e\f%` };
  assert.deepEqual(await fetchQuestionList(query, new AbortController().signal, client), {
    questions: [],
    totalCount: 0,
  });
  const params = requests[0]!.searchParams;
  assert.equal(
    params.get('or'),
    String.raw`(question.ilike."%a,b(c){d}\"e\\\\f\\%%",tags.cs."{\"a,b(c){d}\\\"e\\\\f%\"}")`,
  );
  assert.equal(params.get('category_id'), `eq.${CATEGORY.id}`);
  assert.equal(params.has('difficulty'), false);
  assert.equal(params.get('offset'), '10');
});
