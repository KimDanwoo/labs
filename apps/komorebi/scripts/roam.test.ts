import assert from 'node:assert/strict';
import test from 'node:test';
import {
  depthPace,
  laneEnds,
  passingRoute,
  presence,
  startGait,
  strollOn,
  walkOn,
} from '../src/features/walk/lib/roam';
import { canWalk, type Region } from '../src/shared/world/world';

const REGIONS: Region[] = ['village', 'river', 'coast', 'forest', 'school', 'shops'];

test('every painting has lane ends for animals to come and go', () => {
  for (const region of REGIONS) assert.ok(laneEnds(region).length >= 2, region);
});

test('a passing animal walks on the lanes from one end to another and then leaves', () => {
  let seed = 5;
  const random = () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
  for (const region of REGIONS) {
    for (let i = 0; i < 6; i++) {
      const path = passingRoute(region, random);
      assert.ok(path && path.length >= 2, region);
      let stroll = { path, leg: 0, along: 0 };
      let steps = 0;
      for (;;) {
        const moved = strollOn(stroll, 0.5);
        if (!moved) break;
        stroll = moved.stroll;
        assert.ok(
          canWalk(moved.at.x, moved.at.z, region),
          `${region} off lane at ${moved.at.x.toFixed(1)},${moved.at.z.toFixed(1)}`,
        );
        steps += 1;
        assert.ok(steps < 2_000, 'it leaves eventually');
      }
    }
  }
});

test('an animal keeps an even stride and pace through a corner where its depth changes', () => {
  const corner = [
    { x: 50, z: 94 },
    { x: 50, z: 56 },
    { x: 82, z: 42.8 },
  ];
  const cat = { speed: 7, stride: 1.6 };
  let gait = startGait(corner);
  let lastStep = 0;
  for (let frame = 0; frame < 2_000; frame++) {
    const next = walkOn(gait, cat, 1 / 60);
    if (!next) break;
    const step = next.walked - gait.walked;
    if (lastStep) assert.ok(Math.abs(step - lastStep) < 0.01, `pace jumps at ${gait.at.x},${gait.at.z}`);
    assert.ok(Math.abs(next.phase - gait.phase - cat.speed / 60 / cat.stride) < 1e-9, 'stride phase advances evenly');
    lastStep = step;
    gait = next;
  }
  assert.ok(gait.at.x > 80, 'it walked the whole way');
});

test('an animal keeps facing its way on legs that run straight up or down the painting', () => {
  const leftThenDown = [
    { x: 80, z: 40 },
    { x: 60, z: 40 },
    { x: 60, z: 70 },
  ];
  let gait = startGait(leftThenDown);
  assert.equal(gait.isFacingLeft, true);
  for (let frame = 0; frame < 600; frame++) {
    gait = walkOn(gait, { speed: 7, stride: 1.6 }, 1 / 30) ?? gait;
    assert.equal(gait.isFacingLeft, true, `turned at ${gait.at.x},${gait.at.z}`);
  }
  assert.equal(
    startGait([
      { x: 50, z: 90 },
      { x: 50, z: 60 },
      { x: 70, z: 60 },
    ]).isFacingLeft,
    false,
  );
});

test('an animal fades in from one lane end and out into the other', () => {
  assert.equal(presence(0, 40, 3, 4), 0);
  assert.equal(presence(1.5, 40, 3, 4), 0.5);
  assert.equal(presence(20, 40, 3, 4), 1);
  assert.equal(presence(38, 40, 3, 4), 0.5);
  assert.equal(presence(41, 40, 3, 4), 0);
  assert.ok(depthPace(20) < depthPace(80));
});
