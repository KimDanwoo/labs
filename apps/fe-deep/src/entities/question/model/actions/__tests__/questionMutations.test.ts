import { loadServerActions } from '@shared/lib/__tests__/loadServerActions';
import assert from 'node:assert/strict';
import test from 'node:test';

const ACTIONS_FILE = new URL('../questionMutations.ts', import.meta.url);

test('question ordering failures cannot report a successful mutation', async () => {
  let insertions = 0;
  const result = { data: null, error: { message: 'database unavailable' } };
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    update() {
      return this;
    },
    insert() {
      insertions++;
      return this;
    },
    maybeSingle: async () => result,
    then(resolve: (value: typeof result) => unknown, reject: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  const { exported } = loadServerActions(ACTIONS_FILE, {
    '@shared/lib/requireAdmin': { requireAdmin: async () => ({ id: 'admin' }) },
    '@shared/api/supabaseAdmin': { createAdminSupabaseClient: () => ({ from: () => query }) },
  });
  await assert.rejects(exported.createQuestion!({ category_id: 'cat-1' }), /질문 순서 조회 실패/);
  assert.equal(insertions, 0);
  await assert.rejects(exported.reorderQuestions!('cat-1', ['q-1', 'q-2']), /질문 순서 변경 실패/);
});

test('all question mutations require authorization before accessing the DB', async () => {
  const { exported, clientCount } = loadServerActions(ACTIONS_FILE);
  const args: Record<string, unknown[]> = {
    createQuestion: [{}],
    updateQuestion: ['q-1', {}],
    deleteQuestion: ['q-1'],
    deleteQuestions: [['q-1']],
    updateQuestionsVisibility: [['q-1'], 'show_in_daily', true],
    updateCategoryVisibility: ['cat-1', 'show_in_daily', true],
    reorderQuestions: ['cat-1', ['q-1']],
  };
  for (const [name, mutation] of Object.entries(exported))
    await assert.rejects(mutation(...args[name]!), /관리자 권한/);
  assert.equal(clientCount(), 0);
});
