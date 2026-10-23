import assert from 'node:assert/strict';
import test from 'node:test';
import { ambienceMix } from '../src/features/walk/lib/ambienceMix';

test('each place has its own sound and dusk swaps birds for crickets', () => {
  assert.equal(ambienceMix('river', 'day').water, 1);
  assert.equal(ambienceMix('coast', 'day').waves, 1);
  assert.equal(ambienceMix('forest', 'day').cicadas, 1);
  assert.equal(ambienceMix('village', 'day').water, 0);
  const dusk = ambienceMix('forest', 'evening');
  assert.equal(dusk.birds, 0);
  assert.equal(dusk.crickets, 1);
  assert.ok(dusk.cicadas < ambienceMix('forest', 'day').cicadas);
  const night = ambienceMix('river', 'night');
  assert.equal(night.cicadas, 0);
  assert.equal(night.crickets, 1);
  assert.equal(night.water, 1, 'the river still runs at night');
});

test('a shower adds rain and hushes birds and insects', () => {
  const wet = ambienceMix('forest', 'day', 'rain');
  assert.equal(wet.rain, 1);
  assert.equal(wet.birds, 0);
  assert.ok(wet.cicadas < ambienceMix('forest', 'day').cicadas);
  assert.equal(ambienceMix('forest', 'day').rain, 0);
});
