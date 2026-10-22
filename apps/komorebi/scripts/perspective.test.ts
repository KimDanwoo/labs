import assert from 'node:assert/strict';
import test from 'node:test';
import { characterScale } from '../src/features/walk/lib/perspective';

test('the entire walkable depth keeps shrinking toward the distance, including beyond the old cutoff', () => {
  for (let depth = 22; depth <= 100; depth++) {
    assert.ok(characterScale(depth - 1) < characterScale(depth));
  }
  assert.ok(characterScale(30) < characterScale(46) * 0.8);
  assert.ok(characterScale(35) < characterScale(82) * 0.5);
});

test('perspective stays readable in the distance and never exceeds the existing foreground size', () => {
  assert.equal(characterScale(-10), 0.12);
  assert.equal(characterScale(100), 0.65);
  assert.equal(characterScale(120), 0.65);
});
