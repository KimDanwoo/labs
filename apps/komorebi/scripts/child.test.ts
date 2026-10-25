import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createChild } from '../src/features/walk/lib/child';

test('turning keeps the original boy artwork at the same apparent height and foot anchor', () => {
  const atlas = new THREE.Texture();
  const child = createChild(atlas, { character: 'boy', outfit: 'summer' });
  const sprite = child.group.children[0] as THREE.Sprite;
  const heights = [218, 222, 244, 222];
  for (let facing = 0; facing < 4; facing++) {
    child.update(1 / 60, 0, (facing * Math.PI) / 2, false, false, true);
    assert.ok(Math.abs((sprite.scale.y * heights[facing]!) / 256 - (10.4 * 218) / 256) < 1e-8);
    assert.equal(sprite.center.y, 12 / 512);
    assert.ok(Math.abs(sprite.scale.x / sprite.scale.y - 0.75) < 1e-8);
  }
  child.dispose();
  atlas.dispose();
});

test('changing outfits refreshes the facing calibration and takeoff uses the jump pose immediately', () => {
  const first = new THREE.Texture();
  const second = new THREE.Texture();
  const child = createChild(first, { character: 'boy', outfit: 'summer' });
  const sprite = child.group.children[0] as THREE.Sprite;
  child.setAtlas(second, { character: 'girl', outfit: 'overalls' });
  child.update(1 / 60, 0, Math.PI, false, false, false, 0, 8);
  assert.equal(second.offset.x, 7 / 8);
  assert.equal(second.offset.y, 1 / 4);
  assert.ok(Math.abs(sprite.scale.y - (10.4 * 217) / 219) < 1e-8);
  child.dispose();
  first.dispose();
  second.dispose();
});
