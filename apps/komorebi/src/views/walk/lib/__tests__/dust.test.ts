import assert from 'node:assert/strict';
import test from 'node:test';
import { createDustPositions, driftDustPositions } from '../dust';

const COUNT = 45;
const xOf = (positions: Float32Array, i: number) => positions[i * 3]!;
const yOf = (positions: Float32Array, i: number) => positions[i * 3 + 1]!;

test('the flecks start in the same places on every visit, spread across the painting', () => {
  const positions = createDustPositions();
  assert.equal(positions.length, COUNT * 3);
  assert.deepEqual(positions, createDustPositions());
  for (let i = 0; i < COUNT; i++) {
    assert.ok(Math.abs(xOf(positions, i)) <= 60);
    assert.ok(Math.abs(yOf(positions, i)) <= 35);
    assert.ok(positions[i * 3 + 2]! >= 4 && positions[i * 3 + 2]! <= 24);
  }
});

test('later flecks drift right a little faster, and depth never changes', () => {
  const start = createDustPositions();
  const positions = createDustPositions();
  driftDustPositions(positions, 1, 0);
  assert.ok(Math.abs(xOf(positions, 0) - xOf(start, 0) - 0.15) < 1e-5);
  assert.ok(Math.abs(xOf(positions, 10) - xOf(start, 10) - 0.17) < 1e-5);
  assert.ok(Math.abs(yOf(positions, 0) - yOf(start, 0)) < 1e-6);
  for (let i = 0; i < COUNT; i++) assert.equal(positions[i * 3 + 2], start[i * 3 + 2]);
});

test('a fleck that drifts past the right edge re-enters from the left', () => {
  const positions = createDustPositions();
  positions[0] = 59.95;
  driftDustPositions(positions, 1, 0);
  assert.equal(xOf(positions, 0), -60);
});
