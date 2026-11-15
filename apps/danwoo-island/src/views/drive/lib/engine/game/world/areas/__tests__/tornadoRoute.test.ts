import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pickTornadoDestination } from '../tornadoRoute';

const PLACES = ['tornado', 'a', 'b', 'c', 'start'];

test('아직 안 가 본 곳을 모두 돌기 전에는 같은 곳을 다시 고르지 않는다', () => {
  const visited = new Set(['start']);
  const seen: string[] = [];
  for (let step = 0; step < 3; step += 1) {
    const next = pickTornadoDestination({ places: PLACES, visited, origin: 'tornado', random: Math.random });
    assert.ok(next);
    assert.ok(!visited.has(next));
    visited.add(next);
    seen.push(next);
  }
  assert.deepEqual([...seen].sort(), ['a', 'b', 'c']);
});

test('다 가 봤으면 출발지를 뺀 곳 중에서 고른다', () => {
  const visited = new Set(PLACES);
  for (const value of [0, 0.5, 0.99]) {
    const next = pickTornadoDestination({ places: PLACES, visited, origin: 'tornado', random: () => value });
    assert.ok(next && next !== 'tornado');
  }
});

test('갈 곳이 없으면 null', () => {
  assert.equal(
    pickTornadoDestination({ places: ['tornado'], visited: new Set(), origin: 'tornado', random: Math.random }),
    null,
  );
});
