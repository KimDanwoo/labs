import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCategories, parseQuestionFile } from '../parseQuestionContent';

const META = { source: 'react/007.md', categoryId: 'cat-5', orderNum: 7 };

const VALID_FILE = `---
id: q-1
question: 클로저란?
difficulty: medium
sub_category: 함수
tags:
  - 클로저
show_in_daily: true
show_in_flashcard: false
follow_ups:
  - question: 실무 예시는?
    keywords:
      - 모듈 패턴
    answer: |-
      첫 줄

      둘째 줄
---

**함수**와 렉시컬 환경의 조합입니다.
`;

test('a question file becomes a question with order and category from its path', () => {
  assert.deepEqual(parseQuestionFile(VALID_FILE, META), {
    id: 'q-1',
    category_id: 'cat-5',
    question: '클로저란?',
    answer: '**함수**와 렉시컬 환경의 조합입니다.',
    sub_category: '함수',
    difficulty: 'medium',
    order_num: 7,
    tags: ['클로저'],
    show_in_daily: true,
    show_in_flashcard: false,
    follow_ups: [{ question: '실무 예시는?', keywords: ['모듈 패턴'], answer: '첫 줄\n\n둘째 줄' }],
  });
});

test('follow-ups are optional', () => {
  const withoutFollowUps = VALID_FILE.replace(/follow_ups:[\s\S]*?---\n/, '---\n');
  assert.deepEqual(parseQuestionFile(withoutFollowUps, META).follow_ups, []);
});

test('broken question files fail with the file path in the message', () => {
  const broken = [
    VALID_FILE.replace('difficulty: medium', 'difficulty: extreme'),
    VALID_FILE.replace('show_in_daily: true', 'show_in_daily: yes please'),
    VALID_FILE.replace('id: q-1\n', ''),
    VALID_FILE.replace('**함수**와 렉시컬 환경의 조합입니다.\n', ''),
    VALID_FILE.replace(/^---\n/, ''),
  ];
  for (const raw of broken) assert.throws(() => parseQuestionFile(raw, META), /react\/007\.md/);
});

test('categories keep their listed fields and reject missing ones', () => {
  const raw = '- id: cat-1\n  slug: html\n  title: HTML\n  icon: 🌐\n  description: 기초\n';
  assert.deepEqual(parseCategories(raw, 'categories.yml'), [
    { id: 'cat-1', slug: 'html', title: 'HTML', icon: '🌐', description: '기초' },
  ]);
  assert.throws(() => parseCategories('- id: cat-1\n  slug: html\n', 'categories.yml'), /categories\.yml\[0\]/);
  assert.throws(() => parseCategories('id: cat-1\n', 'categories.yml'), /목록/);
});
