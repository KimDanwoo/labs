import assert from 'node:assert/strict';
import test from 'node:test';
import {
  crossesGate,
  GATES,
  isExplorationClearing,
  LANDMARKS,
  parseProgress,
} from '../src/shared/exploration/world.ts';

test('gate crossing catches dash segments, requires forward crossing and aperture', () => {
  const center = { x: 0, y: 10, z: 20 };
  assert.equal(crossesGate({ x: 0, y: 10, z: 0 }, { x: 0, y: 10, z: 40 }, center), true);
  assert.equal(crossesGate({ x: 0, y: 10, z: 40 }, { x: 0, y: 10, z: 0 }, center), false);
  assert.equal(crossesGate({ x: 8, y: 10, z: 0 }, { x: 8, y: 10, z: 40 }, center), false);
  assert.equal(crossesGate({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 40 }, center), false);
  assert.equal(crossesGate({ x: 0, y: 10, z: 20 }, { x: 0, y: 10, z: 20 }, center), false);
});
test('saved progress tolerates corrupt and old data without trusting unknown IDs', () => {
  for (const raw of [null, 'broken', 'null', '[]'])
    assert.deepEqual(parseProgress(raw), { discovered: [], best: null });
  assert.deepEqual(parseProgress(JSON.stringify({ discovered: ['elder', 'unknown', 'elder'], best: 12.5 })), {
    discovered: ['elder'],
    best: 12.5,
  });
  for (const best of [-1, 0, '12']) assert.equal(parseProgress(JSON.stringify({ best })).best, null);
});
test('landmark and gate approach areas are clear of generated trees and rocks', () => {
  for (const point of [...LANDMARKS, ...GATES]) assert.equal(isExplorationClearing(point.x, point.z), true);
  assert.equal(isExplorationClearing(1000, 1000), false);
  for (let i = 1; i < GATES.length; i++) assert.ok(GATES[i].z > GATES[i - 1].z);
});
