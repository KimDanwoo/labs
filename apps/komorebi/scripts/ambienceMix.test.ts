import assert from 'node:assert/strict';
import test from 'node:test';
import { ambienceMix } from '../src/features/walk/lib/ambienceMix';

test('each place has its own sound and dusk swaps birds for crickets', () => {
  assert.equal(ambienceMix('river', false).water, 1);
  assert.equal(ambienceMix('coast', false).waves, 1);
  assert.equal(ambienceMix('forest', false).cicadas, 1);
  assert.equal(ambienceMix('village', false).water, 0);
  const dusk = ambienceMix('forest', true);
  assert.equal(dusk.birds, 0);
  assert.equal(dusk.crickets, 1);
  assert.ok(dusk.cicadas < ambienceMix('forest', false).cicadas);
});
