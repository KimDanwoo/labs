import assert from 'node:assert/strict';
import test from 'node:test';
import { nearestShore } from '../src/features/walk/lib/water';
import { SHORES } from '../src/shared/world/shore';
import { WATER } from '../src/shared/world/water';
import { WORLDS, type Region } from '../src/shared/world/world';

const inside = (outline: [number, number][], x: number, z: number) => {
  let isInside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, az] = outline[i]!;
    const [bx, bz] = outline[j]!;
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) isInside = !isInside;
  }
  return isInside;
};

test('traced water stays on the painting and runs one way or lies still', () => {
  for (const [region, waters] of Object.entries(WATER)) {
    for (const { outline, flow, speed } of waters) {
      assert.ok(outline.length >= 6, region);
      assert.ok(
        outline.every(([x, z]) => x >= 0 && x <= 100 && z >= 0 && z <= 100),
        region,
      );
      const length = Math.hypot(...flow);
      assert.ok(length === 0 ? speed === 0 : Math.abs(length - 1) < 0.01 && speed > 0, `${region} flow`);
    }
  }
});

test('no lane the child walks is painted as water', () => {
  for (const region of Object.keys(WORLDS) as Region[]) {
    for (const node of WORLDS[region].nodes) {
      const wet = WATER[region].find(({ outline }) => inside(outline, node.x, node.z));
      assert.equal(wet, undefined, `${region} ${node.id} at ${node.x},${node.z}`);
    }
  }
});

test('the shore map measures out to sea as positive and onto land as negative', () => {
  const coast = SHORES.coast!;
  const square = ([x, z]: [number, number]): [number, number] => [(x / 100) * 1.5, z / 100];
  const atSea = nearestShore(square([75, 35]), coast);
  const onLand = nearestShore(square([75, 62]), coast);
  assert.ok(atSea.distance > 0, `sea ${atSea.distance}`);
  assert.ok(onLand.distance < 0, `land ${onLand.distance}`);
  assert.ok(atSea.strength > 0 && atSea.strength <= 1);
});
