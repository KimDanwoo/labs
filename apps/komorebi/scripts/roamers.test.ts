import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createRoamers } from '../src/features/walk/lib/roamers';

// Sprites paint their shadow on a canvas when created; a stand-in is enough here.
const paint = { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} };
Object.assign(globalThis, { document: { createElement: () => ({ getContext: () => paint }) } });

const STEP = 1 / 60;
const VILLAGE = { region: 'village', darkness: 0, isRaining: false, isStill: false, childZ: 0 } as const;

/** A visitor that always pauses partway, from a fixed choice of animal and lane. */
async function visitor() {
  const random = Math.random;
  Math.random = () => 0.1;
  const scene = new THREE.Scene();
  const roamers = createRoamers(scene, {
    loadAsync: async () => new THREE.Texture(),
  } as unknown as THREE.TextureLoader);
  await new Promise((resolve) => setTimeout(resolve));
  for (let i = 0; i < 60 * 15 && !roamers.visitor; i++) roamers.update({ ...VILLAGE, dt: STEP });
  Math.random = random;
  assert.ok(roamers.visitor, 'someone came along');
  const sprite = scene.children.find((child) => child instanceof THREE.Sprite && child.renderOrder > 3.5)!;
  const material = (sprite as THREE.Sprite).material;
  return { roamers, material, offset: () => material.map!.offset.x };
}

test('an animal caught by rain as it steps out only ever fades away', async () => {
  const { roamers, material } = await visitor();
  for (let i = 0; i < 10; i++) roamers.update({ ...VILLAGE, dt: STEP });
  let last = material.opacity;
  while (roamers.visitor) {
    roamers.update({ ...VILLAGE, dt: STEP, isRaining: true });
    assert.ok(material.opacity <= last + 1e-9, `${material.opacity} after ${last}`);
    last = material.opacity;
  }
});

test('with reduced motion an animal holds its pose, even if it was pausing to look around', async () => {
  const { roamers, offset } = await visitor();
  let pausedAt = -1;
  for (let i = 0; i < 60 * 20 && pausedAt < 0 && roamers.visitor; i++) {
    const before = roamers.standing;
    roamers.update({ ...VILLAGE, dt: STEP });
    const after = roamers.standing;
    if (before && after && before.x === after.x && before.z === after.z) pausedAt = i;
  }
  for (let i = 0; i < 20; i++) roamers.update({ ...VILLAGE, dt: STEP });
  assert.ok(pausedAt >= 0, 'it paused');
  const pose = offset();
  for (let i = 0; i < 60 * 3; i++) {
    roamers.update({ ...VILLAGE, dt: STEP, isStill: true });
    assert.equal(offset(), pose);
  }
  assert.ok(roamers.visitor);
});
