import assert from 'node:assert/strict';
import test from 'node:test';
import { atlasColumn } from '../src/features/walk/lib/childFrames';

test('walking never uses the wide running contacts and alternates both passing poses', () => {
  const frames = Array.from({ length: 8 }, (_, i) => atlasColumn(false, true, ((i + 0.1) * Math.PI) / 2));
  assert.deepEqual(frames, [1, 2, 3, 4, 1, 2, 3, 4]);
});

test('running keeps the same gait phase, with passing poses between extended contacts', () => {
  const frames = Array.from({ length: 4 }, (_, i) => atlasColumn(false, true, ((i + 0.1) * Math.PI) / 2, true));
  assert.deepEqual(frames, [5, 2, 6, 4]);
  assert.equal(atlasColumn(false, false, Math.PI, true), 0);
  assert.equal(atlasColumn(true, false, Math.PI), 7);
  assert.equal(atlasColumn(false, true, -0.1), 4);
});
