import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDiscoveries } from '../src/features/walk/model/store/discoveries';
import { LANDMARKS } from '../src/shared/world/world';

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
