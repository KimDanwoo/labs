import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { assertAdminUser } from '../src/shared/lib/adminAuthorization.ts';

test('administrator authorization rejects anonymous and ordinary accounts', () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = ' Admin@Example.com , second@example.com ';
  try {
    for (const user of [null, {}, { email: null }, { email: 'user@example.com' }]) {
      assert.throws(() => assertAdminUser(user), /관리자 권한/);
    }
    assert.doesNotThrow(() => assertAdminUser({ email: 'admin@example.com' }));
    assert.doesNotThrow(() => assertAdminUser({ email: 'SECOND@example.com' }));
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
});

/** Next 요청 컨텍스트 대신 의존성을 주입해 실제 Server Action의 권한 검사 순서를 검증한다. */
function actions(file, overrides = {}) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exported = {};
  let privilegedClients = 0;
  const mocks = {
    '@shared/lib/requireAdmin': {
      requireAdmin: async () => {
        throw new Error('관리자 권한이 필요합니다.');
      },
    },
    '@shared/api/supabaseAdmin': {
      createAdminSupabaseClient: () => {
        privilegedClients++;
        assert.fail('권한 검사 전에 관리자 DB에 접근했습니다.');
      },
    },
    '@shared/api/supabaseServer': {
      createServerSupabaseClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'ordinary-user' } } }) },
      }),
    },
  };
  const require = createRequire(import.meta.url);
  runInNewContext(compiled, { exports: exported, require: (name) => overrides[name] ?? mocks[name] ?? require(name) });
  return { exported, clientCount: () => privilegedClients };
}

test('feedback administration requires authorization before constructing a privileged DB client', async () => {
  const { exported, clientCount } = actions('../src/features/feedback/model/actions/feedbackActions.ts');
  await assert.rejects(exported.getFeedbacks('pending'), /관리자 권한/);
  await assert.rejects(exported.updateFeedbackStatus('feedback-1', 'resolved'), /관리자 권한/);
  assert.equal(clientCount(), 0);
});

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
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  const { exported } = actions('../src/entities/question/model/actions/questionMutations.ts', {
    '@shared/lib/requireAdmin': { requireAdmin: async () => ({ id: 'admin' }) },
    '@shared/api/supabaseAdmin': { createAdminSupabaseClient: () => ({ from: () => query }) },
  });
  await assert.rejects(exported.createQuestion({ category_id: 'cat-1' }), /질문 순서 조회 실패/);
  assert.equal(insertions, 0);
  await assert.rejects(exported.reorderQuestions('cat-1', ['q-1', 'q-2']), /질문 순서 변경 실패/);
});

test('all question mutations require authorization before accessing the DB', async () => {
  const { exported, clientCount } = actions('../src/entities/question/model/actions/questionMutations.ts');
  const args = {
    createQuestion: [{}],
    updateQuestion: ['q-1', {}],
    deleteQuestion: ['q-1'],
    deleteQuestions: [['q-1']],
    updateQuestionsVisibility: [['q-1'], 'show_in_daily', true],
    updateCategoryVisibility: ['cat-1', 'show_in_daily', true],
    reorderQuestions: ['cat-1', ['q-1']],
  };
  for (const [name, mutation] of Object.entries(exported)) await assert.rejects(mutation(...args[name]), /관리자 권한/);
  assert.equal(clientCount(), 0);
});
