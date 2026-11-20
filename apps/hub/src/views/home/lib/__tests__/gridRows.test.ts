import { planCardRowSizes, planRowSizes } from '@views/home/lib/gridRows';
import assert from 'node:assert/strict';
import test from 'node:test';

test('multiples of three fill rows of three', () => {
  assert.deepEqual(planRowSizes(3), [3]);
  assert.deepEqual(planRowSizes(6), [3, 3]);
  assert.deepEqual(planRowSizes(9), [3, 3, 3]);
});

test('even counts that are not multiples of three fill rows of two', () => {
  assert.deepEqual(planRowSizes(2), [2]);
  assert.deepEqual(planRowSizes(4), [2, 2]);
  assert.deepEqual(planRowSizes(8), [2, 2, 2, 2]);
  assert.deepEqual(planRowSizes(10), [2, 2, 2, 2, 2]);
});

test('other counts lead with rows of two so no row is left short', () => {
  assert.deepEqual(planRowSizes(5), [2, 3]);
  assert.deepEqual(planRowSizes(7), [2, 2, 3]);
  assert.deepEqual(planRowSizes(11), [2, 3, 3, 3]);
  assert.deepEqual(planRowSizes(13), [2, 2, 3, 3, 3]);
});

test('zero and one card are handled', () => {
  assert.deepEqual(planRowSizes(0), []);
  assert.deepEqual(planRowSizes(1), [1]);
});

test('every card gets the size of its row', () => {
  assert.deepEqual(planCardRowSizes(5), [2, 2, 3, 3, 3]);
  for (let cardCount = 0; cardCount <= 30; cardCount += 1) {
    assert.equal(planCardRowSizes(cardCount).length, cardCount);
  }
});
