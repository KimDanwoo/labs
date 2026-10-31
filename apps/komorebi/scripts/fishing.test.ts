import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCatch, isBiteOnTime, parseCollection, rollCatch } from '../src/features/walk/lib/fishing';

test('fishing draws common and rare fish at the pool boundaries', () => {
  assert.deepEqual(
    rollCatch(() => 0),
    { id: 'goby', size: 8 },
  );
  assert.deepEqual(
    rollCatch(() => 1),
    { id: 'bream', size: 65 },
  );
});
test('collection adds catches without losing the largest size or other fish', () => {
  const first = addCatch({}, { id: 'goby', size: 15 });
  const next = addCatch(first, { id: 'goby', size: 8 });
  assert.deepEqual(next.goby, { count: 2, best: 15 });
  assert.deepEqual(first.goby, { count: 1, best: 15 });
  assert.deepEqual(addCatch(next, { id: 'bream', size: 40 }).goby, next.goby);
});
test('corrupt or unrecognized saved records cannot break the fishing journal', () => {
  for (const raw of [null, '{', 'null', '[]', '{"goby":{"count":-1,"best":10}}', '{"goby":{"count":1,"best":999}}'])
    assert.deepEqual(parseCollection(raw), {});
  assert.deepEqual(parseCollection('{"goby":{"count":2,"best":15},"other":{"count":1,"best":1}}'), {
    goby: { count: 2, best: 15 },
  });
});
test('a suspended tab cannot turn an expired bite into a catch', () => {
  assert.equal(isBiteOnTime(1799, 1800), true);
  assert.equal(isBiteOnTime(1800, 1800), false);
  assert.equal(isBiteOnTime(9000, 1800), false);
});
