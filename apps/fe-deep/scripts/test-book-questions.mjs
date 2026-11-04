import assert from 'node:assert/strict';
import test from 'node:test';
import { GROUPS, NEW_CATEGORIES, buildBookQuestionRows } from './lib/bookQuestions.mjs';

test('all book questions have unique IDs, complete content and preserved group ordering', () => {
  const rows = buildBookQuestionRows();
  assert.equal(
    rows.length,
    GROUPS.reduce((count, group) => count + group.items.length, 0),
  );
  assert.ok(rows.length > 0);
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  let offset = 0;
  for (const group of GROUPS) {
    assert.equal(rows[offset].order_num, group.startOrder + 1);
    assert.equal(rows[offset].category_id, group.categoryId);
    offset += group.items.length;
  }
  assert.equal(new Set(NEW_CATEGORIES.map((category) => category.id)).size, NEW_CATEGORIES.length);
});

test('invalid or duplicated input is rejected before any DB client is needed', () => {
  assert.throws(() => buildBookQuestionRows([...GROUPS, GROUPS[0]]), /중복 id/);
  assert.throws(
    () => buildBookQuestionRows([{ categoryId: 'cat-1', startOrder: 0, items: [{ id: 'q-1', question: '' }] }]),
    /필수/,
  );
});
