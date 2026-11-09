import { aquariumFishArt, aquariumPose } from '@features/walk/lib/aquarium';
import { FISH_HOME } from '@features/walk/lib/companions';
import { FISH } from '@features/walk/lib/fishing';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('every fish stays inside painted water at all sizes, turns and feeding stages', () => {
  for (const species of FISH) {
    const fish = { id: species.id, size: species.max, uid: species.id, home: FISH_HOME.tank };
    assert.ok(aquariumFishArt(fish.id).ratio > 1);
    for (let t = 0; t < 80; t += 0.3) {
      for (const feedAge of [0, 0.6, 1.5, 2.5, 3, 10]) {
        const pose = aquariumPose(fish, t, feedAge, false);
        assert.ok(pose.x - pose.width / 2 > 0.1 && pose.x + pose.width / 2 < 0.9);
        assert.ok(pose.y > 0.2 && pose.y < 0.5);
        assert.ok(Number.isFinite(pose.facing));
      }
    }
    assert.deepEqual(aquariumPose(fish, 0, 10, true), aquariumPose(fish, 100, 1, true));
    assert.ok(aquariumPose(fish, 0, 1, false).y < 0.3);
  }
});
