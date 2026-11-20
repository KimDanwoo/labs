import {
  findCategoryBySlug,
  pickQuestionsByIds,
  questionsInCategory,
  searchQuestionContent,
} from '@entities/question/model/services/questionQueries';
import type { Category, Question, QuestionContent } from '@entities/question/model/types/types';
import assert from 'node:assert/strict';
import test from 'node:test';

const category = (id: string, slug: string): Category => ({
  id,
  slug,
  title: slug,
  order_num: 1,
  icon: '',
  description: '',
  question_count: 0,
});

const question = (id: string, categoryId: string, orderNum: number, overrides: Partial<Question> = {}): Question => ({
  id,
  category_id: categoryId,
  question: `질문 ${id}`,
  answer: `답변 ${id}`,
  sub_category: '',
  difficulty: 'easy',
  order_num: orderNum,
  tags: [],
  show_in_daily: true,
  show_in_flashcard: true,
  follow_ups: [],
  ...overrides,
});

const CONTENT: QuestionContent = {
  categories: [category('cat-1', 'html'), category('cat-2', 'react')],
  questions: [
    question('q-3', 'cat-2', 2, { question: '훅 규칙은?' }),
    question('q-1', 'cat-1', 1, { answer: '시맨틱 태그를 쓴다' }),
    question('q-2', 'cat-2', 1, { tags: ['Hooks'] }),
  ],
};

test('category lookups use the slug and keep file order', () => {
  assert.equal(findCategoryBySlug(CONTENT, 'react')?.id, 'cat-2');
  assert.equal(findCategoryBySlug(CONTENT, 'vue'), undefined);
  assert.deepEqual(
    questionsInCategory(CONTENT, 'cat-2').map((q) => q.id),
    ['q-2', 'q-3'],
  );
});

test('questions are picked by id', () => {
  assert.deepEqual(
    pickQuestionsByIds(CONTENT, ['q-3', 'missing']).map((q) => q.id),
    ['q-3'],
  );
});

test('search matches question, answer, then tag, case-insensitively', () => {
  const matches = (query: string) =>
    searchQuestionContent(CONTENT, query).map(({ question: q, category: c, matchType }) => [q.id, c.slug, matchType]);

  assert.deepEqual(matches('훅'), [['q-3', 'react', 'question']]);
  assert.deepEqual(matches('시맨틱'), [['q-1', 'html', 'answer']]);
  assert.deepEqual(matches('hooks'), [['q-2', 'react', 'tag']]);
  assert.deepEqual(matches('   '), []);
});
