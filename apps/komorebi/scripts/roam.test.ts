import assert from 'node:assert/strict';
import test from 'node:test';
import { laneEnds, passingRoute, strollOn } from '../src/features/walk/lib/roam';
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
