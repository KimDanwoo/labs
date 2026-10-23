import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { LAMPS, lampGlowAt, lightSprite } from '../src/features/walk/lib/nightLights';

test('lamplight is brightest at a lamp, fades with distance and never reaches across the painting', () => {
  const lantern = LAMPS.forest[0]!;
  const at = lampGlowAt('forest', lantern);
  const near = lampGlowAt('forest', { x: lantern.x + 4, z: lantern.z });
  const far = lampGlowAt('forest', { x: 5, z: 95 });
  assert.ok(at > near && near > far, `${at} > ${near} > ${far}`);
  assert.equal(far, 0);
  assert.ok(at <= 0.9);
});

test('a sprite is untouched by day, moonlit blue at night and warmed back under a lamp', () => {
  const color = new THREE.Color();
  lightSprite(color, 0, 0.9);
  assert.deepEqual(color.toArray(), [1, 1, 1]);
  lightSprite(color, 1, 0);
  const moonlit = color.clone();
  assert.ok(moonlit.b > moonlit.r);
  lightSprite(color, 1, 0.9);
  assert.ok(color.r > moonlit.r && color.r > color.b);
});
