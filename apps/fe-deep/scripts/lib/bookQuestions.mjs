import { AI } from '../data/book-questions/ai.mjs';
import { BROWSER } from '../data/book-questions/browser.mjs';
import { BUILD } from '../data/book-questions/build.mjs';
import { CSS } from '../data/book-questions/css.mjs';
import { HTML } from '../data/book-questions/html.mjs';
import { JS } from '../data/book-questions/js.mjs';
import { NEW_CATEGORIES } from '../data/book-questions/new-categories.mjs';
import { NEXT } from '../data/book-questions/next.mjs';
import { PATTERN } from '../data/book-questions/pattern.mjs';
import { REACT } from '../data/book-questions/react.mjs';
import { SECURITY } from '../data/book-questions/security.mjs';

export { NEW_CATEGORIES };
export const GROUPS = [
  { categoryId: 'cat-1', startOrder: 15, items: HTML },
  { categoryId: 'cat-2', startOrder: 14, items: CSS },
  { categoryId: 'cat-3', startOrder: 16, items: JS },
  { categoryId: 'cat-5', startOrder: 15, items: REACT },
  { categoryId: 'cat-6', startOrder: 12, items: NEXT },
  { categoryId: 'cat-7', startOrder: 12, items: BROWSER },
  { categoryId: 'cat-10', startOrder: 8, items: SECURITY },
  { categoryId: 'cat-13', startOrder: 8, items: PATTERN },
  { categoryId: 'cat-17', startOrder: 0, items: BUILD },
  { categoryId: 'cat-18', startOrder: 0, items: AI },
];

export function buildBookQuestionRows(groups = GROUPS) {
  const rows = groups.flatMap(({ categoryId, startOrder, items }) =>
    items.map((question, index) => ({
      ...question,
      category_id: categoryId,
      order_num: startOrder + index + 1,
      show_in_daily: true,
      show_in_flashcard: true,
    })),
  );
  const ids = rows.map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error('중복 id 존재');
  for (const row of rows) {
    if (
      !row.id ||
      typeof row.question !== 'string' ||
      !row.question.trim() ||
      typeof row.answer !== 'string' ||
      !row.answer.trim()
    )
      throw new Error('질문 id·질문·답변은 필수입니다.');
    if (!['easy', 'medium', 'hard'].includes(row.difficulty) || !Array.isArray(row.tags))
      throw new Error('난이도 또는 태그 형식이 잘못되었습니다.');
  }
  return rows;
}
