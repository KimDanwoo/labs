import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FIGHT_OUTCOME,
  startFight,
  stepFight,
  addCatch,
  isBiteOnTime,
  parseCollection,
  rollCatch,
} from '../src/features/walk/lib/fishing';

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
  for (const size of [8, 18, 38, 40, 65]) {
    let state = startFight(false);
    for (let i = 0; i < 1200 && state.outcome === FIGHT_OUTCOME.active; i++) {
      state = stepFight(state, state.tension < 60, 0.05, size);
    }
    assert.equal(state.outcome, FIGHT_OUTCOME.landed, `size ${size}`);
    assert.equal(stepFight(state, true, 1, size), state);
  }
});
