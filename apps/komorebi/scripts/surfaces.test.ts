import assert from 'node:assert/strict';
import test from 'node:test';
import { SURFACE, surfaceAt } from '../src/shared/world/surfaces';
import { WORLDS } from '../src/shared/world/world';

test('bridges sound like wood and the rest of each painting keeps its own ground', () => {
  assert.equal(surfaceAt({ x: 50, z: 48 }, 'river'), SURFACE.wood);
  assert.equal(surfaceAt({ x: 15, z: 70 }, 'river'), SURFACE.dirt);
  assert.equal(surfaceAt({ x: 88, z: 42 }, 'village'), SURFACE.wood);
  assert.equal(surfaceAt({ x: 50, z: 82 }, 'village'), SURFACE.dirt);
  assert.equal(surfaceAt({ x: 50, z: 60 }, 'school'), SURFACE.sand);
  assert.equal(surfaceAt({ x: 50, z: 95 }, 'school'), SURFACE.dirt);
  assert.equal(surfaceAt({ x: 50, z: 70 }, 'forest'), SURFACE.stone);
});

test('the river bridge node lies on wood', () => {
  const riverBridge = WORLDS.river.nodes.find((node) => node.id === 'river')!;
  assert.equal(surfaceAt(riverBridge, 'river'), SURFACE.wood);
  const villageBridge = WORLDS.village.nodes.find((node) => node.id === 'bridge')!;
  assert.equal(surfaceAt(villageBridge, 'village'), SURFACE.wood);
});
