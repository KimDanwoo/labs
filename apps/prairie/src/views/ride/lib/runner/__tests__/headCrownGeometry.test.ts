import { makeHeadCrownGeometry, mirrored } from '@views/ride/lib/runner/headCrownGeometry';
import assert from 'node:assert/strict';
import test from 'node:test';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';

function legacyHeadCrown() {
  const brow = new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(-0.28, 0.25, 0.25),
      new Vector3(-0.17, 0.3, 0.35),
      new Vector3(0, 0.35, 0.39),
      new Vector3(0.17, 0.3, 0.35),
      new Vector3(0.28, 0.25, 0.25),
    ]),
    32,
    0.012,
    6,
    false,
  );
  const locks = Array.from({ length: 7 }, (_, i) => {
    const side = (i - 3) / 3;
    return new TubeGeometry(
      new CatmullRomCurve3([
        new Vector3(side * 0.04, -0.12, 0.48),
        new Vector3(side * 0.13, 0.08, 0.6),
        new Vector3(side * 0.16, 0.36, 0.38),
        new Vector3(side * 0.14, 0.55 + Math.abs(side) * 0.1, 0.22),
      ]),
      24,
      0.018 - Math.abs(side) * 0.006,
      5,
      false,
    );
  });
  return { brow, locks };
}

const arraysOf = (geometry: TubeGeometry) => ({
  position: Array.from(geometry.getAttribute('position').array),
  normal: Array.from(geometry.getAttribute('normal').array),
});

test('the head crown builds the same brow and mane locks as before', () => {
  const legacy = legacyHeadCrown();
  const current = makeHeadCrownGeometry();
  assert.deepEqual(arraysOf(current.brow), arraysOf(legacy.brow));
  assert.equal(current.locks.length, legacy.locks.length);
  current.locks.forEach((lock, index) => assert.deepEqual(arraysOf(lock), arraysOf(legacy.locks[index]!)));
});

test('eye parts mirror only the x offset', () => {
  assert.deepEqual(mirrored([0.285, 0.35, 0.205], -1), [-0.285, 0.35, 0.205]);
  assert.deepEqual(mirrored([0.285, 0.35, 0.205], 1), [0.285, 0.35, 0.205]);
});
