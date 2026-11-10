import { boundedDpr, RENDER_PIXELS } from '@shared/lib/renderBudget';
import assert from 'node:assert/strict';
import test from 'node:test';
import { MEADOW_PATH, meadowPathDistanceAt, meadowPathX, RIDGES, waterDepthAt } from '../../config/scene';
import { LANDMARKS } from '../../model/exploration/world';
import { makeLeafCanopy } from '../makeLeafCanopy';
import { makeRidgeTexture } from '../makeRidgeTexture';

test('leaf canopy has finite normals and a bounded geometry budget at both detail levels', () => {
  for (const count of [100, 180, 240]) {
    const geometry = makeLeafCanopy(2.2, count);
    try {
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      assert.equal(positions.count, count * 12);
      assert.equal(geometry.getAttribute('color').count, positions.count);
      assert.ok(geometry.boundingSphere!.radius <= 2.2 * 1.6);
      for (let i = 0; i < positions.count; i++) {
        assert.ok(
          Number.isFinite(positions.getX(i)) &&
            Number.isFinite(positions.getY(i)) &&
            Number.isFinite(positions.getZ(i)),
        );
        const length = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
        assert.ok(Math.abs(length - 1) < 0.001);
      }
    } finally {
      geometry.dispose();
    }
  }
});

test('revisiting the same canopy produces the same leaves without random layout changes', () => {
  const first = makeLeafCanopy(2.2, 100);
  const second = makeLeafCanopy(2.2, 100);
  try {
    assert.deepEqual(first.getAttribute('position').array, second.getAttribute('position').array);
  } finally {
    first.dispose();
    second.dispose();
  }
});

test('the meadow trail passes within reach of all landmarks and stays on dry land', () => {
  for (const place of LANDMARKS) {
    assert.ok(meadowPathDistanceAt(place.x, place.z) < place.radius, `${place.name} is reachable from the trail`);
  }
  for (let z = 0; z <= MEADOW_PATH.length; z += 5) {
    assert.equal(waterDepthAt(meadowPathX(z), z), 0);
  }
  assert.equal(meadowPathDistanceAt(0, -26), Infinity);
  assert.equal(meadowPathDistanceAt(0, MEADOW_PATH.length + 26), Infinity);
  assert.ok(Math.abs(meadowPathX(0)) < 0.001 && Math.abs(meadowPathX(MEADOW_PATH.length)) < 0.001);
});

const SCREENS: [width: number, height: number][] = [
  [390, 844],
  [1440, 960],
  [3840, 2160],
  [7680, 4320],
];

test('ultrawide and high-density screens stay within the render pixel budget', () => {
  for (const budget of Object.values(RENDER_PIXELS)) {
    for (const [width, height] of SCREENS) {
      const dpr = boundedDpr(width, height, 1.5, budget);
      assert.ok(dpr > 0 && dpr <= 1.5);
      assert.ok(width * height * dpr * dpr <= budget + 1);
    }
  }
  assert.equal(boundedDpr(390, 844, 1, RENDER_PIXELS.mobile), 1);
});

test('baked mountain profiles have a fixed 12 KiB budget and a seamless horizon', () => {
  const texture = makeRidgeTexture(RIDGES);
  try {
    const data = texture.image.data!;
    assert.equal(data.byteLength, 12_288);
    for (let row = 0; row < RIDGES.length; row++) {
      const start = row * 1024 * 4;
      const end = start + 1023 * 4;
      assert.deepEqual(data.slice(start, start + 4), data.slice(end, end + 4));
    }
  } finally {
    texture.dispose();
  }
});
