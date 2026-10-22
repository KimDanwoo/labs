import assert from 'node:assert/strict';
import test from 'node:test';
import { createCreatureState, crossedArch, habitatSeed, updateCreature } from '../src/shared/wildlife/behavior.ts';

test('wildlife reacts to proximity, remembers danger briefly, then settles', () => {
  const state = createCreatureState();
  for (let i = 0; i < 60; i++) updateCreature(state, 3, 10, 1 / 60);
  assert.ok(state.alert > 0.9);
  for (let i = 0; i < 60; i++) updateCreature(state, 30, 10, 1 / 60);
  assert.ok(state.alert > 0.9);
  for (let i = 0; i < 900; i++) updateCreature(state, 30, 10, 1 / 60);
  assert.ok(state.alert < 0.001);
  const before = { ...state };
  updateCreature(state, 0, 10, NaN);
  assert.deepEqual(state, before);
});
test('reaction timing is stable across frame rates', () => {
  const results = [30, 60, 120].map((fps) => {
    const state = createCreatureState();
    for (let i = 0; i < fps; i++) updateCreature(state, 0, 10, 1 / fps);
    return state.alert;
  });
  assert.ok(Math.max(...results) - Math.min(...results) < 0.0001);
});
test('arch responds to crossing its opening in either direction, including fast movement', () => {
  const a = { x: 0, y: 5, z: -20 },
    b = { x: 0, y: 5, z: 20 };
  assert.equal(crossedArch(a, b, 0, 0, 0), true);
  assert.equal(crossedArch(b, a, 0, 0, 0), true);
  assert.equal(crossedArch(a, a, 0, 0, 0), false);
  assert.equal(crossedArch({ ...a, x: 7 }, { ...b, x: 7 }, 0, 0, 0), false);
  assert.equal(crossedArch({ ...a, y: 23 }, { ...b, y: 23 }, 0, 0, 0), false);
});
test('habitat seeds remain deterministic across positive and negative world coordinates', () => {
  for (const x of [-400, -1, 0, 1, 400]) {
    const seed = habitatSeed(x, 7, 2);
    assert.equal(seed, habitatSeed(x, 7, 2));
    assert.ok(seed >= 0 && seed < 1);
  }
});
