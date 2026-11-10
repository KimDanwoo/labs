import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FISHING_PIER, LANDMARKS, canWalk, findRoute, movePlayer, type Point } from '../world';

test('the fishing pier can be reached from the harbour entrance and the sea viewpoint without crossing water', () => {
  assert.ok(canWalk(FISHING_PIER.x, FISHING_PIER.z, 'coast'));
  for (const start of [{ x: 12, z: 62 }, LANDMARKS.find((place) => place.id === 'sea')!]) {
    let position: Point = start;
    const route = findRoute(start, FISHING_PIER, 'coast');
    assert.ok(route.length);
    for (const waypoint of route) {
      for (let i = 0; i < 2000 && Math.hypot(position.x - waypoint.x, position.z - waypoint.z) > 0.1; i++) {
        const distance = Math.hypot(waypoint.x - position.x, waypoint.z - position.z);
        const step = Math.min(distance, 0.25);
        position = movePlayer(
          position,
          ((waypoint.x - position.x) / distance) * step,
          ((waypoint.z - position.z) / distance) * step,
          'coast',
        );
        assert.ok(canWalk(position.x, position.z, 'coast'));
      }
      assert.ok(Math.hypot(position.x - waypoint.x, position.z - waypoint.z) < 0.1);
    }
    assert.ok(Math.hypot(position.x - FISHING_PIER.x, position.z - FISHING_PIER.z) < 1.6);
  }
});
