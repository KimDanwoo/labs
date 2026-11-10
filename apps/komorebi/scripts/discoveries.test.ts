import { parseDayPages, parseDiscoveries } from '@views/walk/model/store/discoveries';
import { LANDMARKS } from '@views/walk/model/world/world';
import assert from 'node:assert/strict';
import test from 'node:test';

test('stored discoveries keep known landmarks once, in order, and survive corrupt data', () => {
  const [first, second] = LANDMARKS;
  assert.deepEqual(parseDiscoveries(JSON.stringify([second!.id, first!.id, second!.id, 'unknown', 3])), [
    second!.id,
    first!.id,
  ]);
  assert.deepEqual(parseDiscoveries(null), []);
  assert.deepEqual(parseDiscoveries('{"not":"a list"}'), []);
  assert.deepEqual(parseDiscoveries('not json'), []);
});

test('day pages start from the legacy list until they have their own record', () => {
  assert.deepEqual(parseDayPages(null, '["fields","river"]'), ['fields', 'river']);
  assert.deepEqual(parseDayPages('["sea"]', '["fields","river"]'), ['sea']);
  assert.deepEqual(parseDayPages('[]', '["fields"]'), [], 'an empty own record is not replaced by the legacy list');
  assert.deepEqual(parseDayPages(null, null), []);
});
