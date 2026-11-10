import {
  FIGHT_OUTCOME,
  FISH,
  FISH_TOTAL_WEIGHT,
  addCatch,
  fishSurge,
  isBiteOnTime,
  parseCollection,
  rollCatch,
  startFight,
  stepFight,
} from '@views/walk/lib/fishing';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('fishing draws common and rare fish at the pool boundaries', () => {
  assert.deepEqual(
    rollCatch(() => 0),
    { id: 'goby', size: 8 },
  );
  assert.deepEqual(
    rollCatch(() => 1),
    { id: 'grouper', size: 100 },
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

test('holding too hard snaps the line and leaving it slack loses the fish', () => {
  let pulling = startFight(false);
  let slack = startFight(false);
  for (let i = 0; i < 200; i++) {
    pulling = stepFight(pulling, true, 0.05, 65);
    slack = stepFight(slack, false, 0.05, 65);
  }
  assert.equal(pulling.outcome, FIGHT_OUTCOME.snapped);
  assert.equal(slack.outcome, FIGHT_OUTCOME.escaped);
});
test('alternating reel and release lands every fish size, and perfect hooks give a head start', () => {
  assert.ok(startFight(true).progress > startFight(false).progress);
  for (const fish of FISH)
    for (const size of [fish.min, fish.max]) {
      let state = startFight(false);
      for (let i = 0; i < 1200 && state.outcome === FIGHT_OUTCOME.active; i++) {
        state = stepFight(state, state.tension < 60, 0.05, size, fish.id);
      }
      assert.equal(state.outcome, FIGHT_OUTCOME.landed, `size ${size}`);
      assert.equal(stepFight(state, true, 1, size), state);
    }
});

test('every species has a reachable weighted interval and valid size endpoints', () => {
  assert.equal(new Set(FISH.map((fish) => fish.id)).size, 16);
  assert.equal(FISH_TOTAL_WEIGHT, 100);
  let cumulative = 0;
  for (const fish of FISH) {
    const ticket = (cumulative + fish.weight / 2) / FISH_TOTAL_WEIGHT;
    for (const sizeRoll of [0, 1]) {
      let calls = 0;
      const caught = rollCatch(() => (calls++ === 0 ? ticket : sizeRoll));
      assert.deepEqual(caught, { id: fish.id, size: sizeRoll ? fish.max : fish.min });
      const saved = addCatch({}, caught);
      assert.deepEqual(parseCollection(JSON.stringify(saved)), saved);
    }
    cumulative += fish.weight;
  }
});

test('the expanded journal preserves all four original species and their records', () => {
  const legacy = {
    goby: { count: 3, best: 18 },
    mackerel: { count: 2, best: 38 },
    rockfish: { count: 1, best: 40 },
    bream: { count: 1, best: 65 },
  };
  assert.deepEqual(parseCollection(JSON.stringify(legacy)), legacy);
  const expanded = addCatch(legacy, { id: 'grouper', size: 100 });
  for (const [id, entry] of Object.entries(legacy)) assert.deepEqual(expanded[id], entry);
});

test('species resistance differs and always includes recovery windows', () => {
  const patterns = FISH.map((fish) => Array.from({ length: 200 }, (_, i) => fishSurge(fish.id, i * 0.1)));
  assert.equal(new Set(patterns.map((pattern) => pattern.join())).size, FISH.length);
  for (const pattern of patterns) {
    assert.ok(pattern.includes(true));
    assert.ok(pattern.includes(false));
  }
});
