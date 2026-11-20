import { loadQuestionContent } from '@entities/question/model/server/loadQuestionContent';
import assert from 'node:assert/strict';
import test from 'node:test';

test('every file in content/questions loads, and each category owns its questions', async () => {
  const { categories, questions } = await loadQuestionContent();

  assert.ok(categories.length > 0);
  assert.equal(
    categories.reduce((sum, category) => sum + category.question_count, 0),
    questions.length,
  );
  const categoryIds = new Set(categories.map((category) => category.id));
  assert.ok(questions.every((question) => categoryIds.has(question.category_id)));
  assert.deepEqual(
    categories.map((category) => category.order_num),
    categories.map((_, index) => index + 1),
  );
});
