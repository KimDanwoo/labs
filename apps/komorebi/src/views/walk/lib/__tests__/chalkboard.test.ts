import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHALKBOARD_LIMIT,
  canAddPoint,
  canAddStroke,
  isFarEnough,
  parseChalkboard,
  roundCoordinate,
  serializeChalkboard,
  type ChalkStroke,
} from '../chalkboard';

const chalk = (points: number[]): ChalkStroke => ({ tool: 'chalk', color: 'white', points });

test('a saved board comes back stroke for stroke, erasers included', () => {
  const strokes: ChalkStroke[] = [
    { tool: 'chalk', color: 'pink', points: [0.1, 0.2, 0.3, 0.4] },
    { tool: 'eraser', points: [0.2, 0.3] },
  ];
  assert.deepEqual(parseChalkboard(serializeChalkboard(strokes)), strokes);
});

test('missing, broken or foreign storage leaves a clean board', () => {
  for (const raw of [null, '', '{', 'null', '[]', '{"version":2,"strokes":[]}', '{"version":1,"strokes":{}}'])
    assert.deepEqual(parseChalkboard(raw), [], String(raw));
});

test('one malformed stroke drops the whole board instead of replaying it half-erased', () => {
  const malformed = [
    { tool: 'chalk', color: 'purple', points: [0.1, 0.1] },
    { tool: 'chalk', color: 'white', points: [0.1, 1.5] },
    { tool: 'chalk', color: 'white', points: [0.1] },
    { tool: 'chalk', color: 'white', points: [] },
    { tool: 'chalk', color: 'white', points: [0.1, '0.2'] },
    { tool: 'brush', points: [0.1, 0.2] },
    { tool: 'chalk', color: 'constructor', points: [0.1, 0.2] },
  ];
  for (const stroke of malformed) {
    const raw = JSON.stringify({ version: 1, strokes: [chalk([0.5, 0.5]), stroke] });
    assert.deepEqual(parseChalkboard(raw), [], JSON.stringify(stroke));
  }
});

test('boards beyond the stroke, point or size limits are refused', () => {
  const tooManyStrokes = Array.from({ length: CHALKBOARD_LIMIT.strokes + 1 }, () => chalk([0.5, 0.5]));
  assert.deepEqual(parseChalkboard(serializeChalkboard(tooManyStrokes)), []);
  const tooManyPoints = [chalk(Array.from({ length: (CHALKBOARD_LIMIT.points + 1) * 2 }, () => 0.5))];
  assert.deepEqual(parseChalkboard(serializeChalkboard(tooManyPoints)), []);
  assert.deepEqual(parseChalkboard(' '.repeat(CHALKBOARD_LIMIT.rawLength + 1)), []);
});

test('drawing stops at the limits rather than dropping older strokes', () => {
  const full = Array.from({ length: CHALKBOARD_LIMIT.strokes }, () => chalk([0.5, 0.5]));
  assert.equal(canAddStroke(full), false);
  assert.equal(canAddStroke(full.slice(1)), true);
  const nearlyFull = [chalk(Array.from({ length: (CHALKBOARD_LIMIT.points - 1) * 2 }, () => 0.5))];
  assert.equal(canAddPoint(nearlyFull, []), true);
  assert.equal(canAddPoint(nearlyFull, [0.5, 0.5]), false);
});

test('coordinates are clamped to the slate and kept to three decimals', () => {
  assert.equal(roundCoordinate(-0.2), 0);
  assert.equal(roundCoordinate(1.3), 1);
  assert.equal(roundCoordinate(0.12345), 0.123);
});

test('tiny pointer jitters do not add points', () => {
  assert.equal(isFarEnough([], 0.5, 0.5), true);
  assert.equal(isFarEnough([0.5, 0.5], 0.5005, 0.5), false);
  assert.equal(isFarEnough([0.5, 0.5], 0.51, 0.5), true);
});
