import assert from 'node:assert/strict';
import test from 'node:test';
import { makeRockGeometry } from '../src/views/ride/lib/flora/makeFloraGeometry.ts';
import { makeWingGeometry } from '../src/views/ride/lib/runner/makeWingGeometry.ts';
import { makeSurfaceBump, SURFACE_KIND } from '../src/views/ride/lib/makeSurfaceBump.ts';

test('layered feathers have valid UVs, normals and colors within the existing geometry budget', () => {
  const wing = makeWingGeometry(4.4, 26);
  try {
    const position = wing.getAttribute('position'),
      uv = wing.getAttribute('uv'),
      normal = wing.getAttribute('normal'),
      color = wing.getAttribute('color');
    assert.equal(uv.count, position.count);
    assert.equal(color.count, position.count);
    assert.ok(wing.getIndex().count / 3 < 5000);
    for (let i = 0; i < position.count; i++) {
      assert.ok(uv.getX(i) >= 0 && uv.getX(i) <= 1 && uv.getY(i) >= 0 && uv.getY(i) <= 1);
      assert.ok(Math.abs(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1) < 0.01);
      assert.ok([color.getX(i), color.getY(i), color.getZ(i)].every((value) => value >= 0 && value <= 1));
    }
  } finally {
    wing.dispose();
  }
});

test('stone, bark and wool reliefs stay at 4 KiB and contain surface variation', () => {
  for (const kind of Object.values(SURFACE_KIND)) {
    const texture = makeSurfaceBump(kind);
    try {
      assert.equal(texture.image.data.byteLength, 4096);
      const values = new Set(texture.image.data);
      assert.ok(values.size > 30);
      assert.equal(texture.generateMipmaps, true);
    } finally {
      texture.dispose();
    }
  }
});

test('organic rocks retain UVs and finite normals at both quality levels', () => {
  for (const level of [1, 2]) {
    const rock = makeRockGeometry(level);
    try {
      const position = rock.getAttribute('position'),
        normal = rock.getAttribute('normal');
      assert.equal(rock.getAttribute('uv').count, position.count);
      assert.equal(rock.getAttribute('color').count, position.count);
      assert.ok(rock.getIndex().count / 3 <= 200);
      for (let i = 0; i < position.count; i++) {
        assert.ok(
          Number.isFinite(position.getX(i)) && Number.isFinite(position.getY(i)) && Number.isFinite(position.getZ(i)),
        );
        assert.ok(
          Number.isFinite(normal.getX(i)) && Number.isFinite(normal.getY(i)) && Number.isFinite(normal.getZ(i)),
        );
      }
    } finally {
      rock.dispose();
    }
  }
});
