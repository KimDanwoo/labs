import assert from 'node:assert/strict';
import test from 'node:test';
import { BIRD_STATE, startSparrow, stepSparrow } from '../src/features/walk/lib/sparrows';
import { canWalk, findRoute, HOME, HOME_DOOR, SPAWN } from '../src/shared/world/world';

test('sparrows flee approaching feet, wait on their branch, then return once the lane is clear', () => {
  const bird = startSparrow({ x: 30, z: 47 }, { x: 22, z: 31 }, 1);
  stepSparrow(bird, { x: 30, z: 48 }, 0.016);
  assert.equal(bird.state, BIRD_STATE.flying);
  for (let i = 0; i < 200; i++) stepSparrow(bird, { x: 30, z: 48 }, 0.016);
  assert.equal(bird.state, BIRD_STATE.perched);
  for (let i = 0; i < 1000; i++) stepSparrow(bird, { x: 30, z: 48 }, 0.016);
  assert.equal(bird.state, BIRD_STATE.perched);
  for (let i = 0; i < 150; i++) stepSparrow(bird, { x: 80, z: 80 }, 0.016);
  assert.equal(bird.state, BIRD_STATE.ground);
  assert.ok(Math.abs(bird.at.x - bird.home.x) < 1);
});

test('the home doorstep is walkable and connects to the village entry', () => {
  assert.ok(canWalk(HOME.x, HOME.z, HOME.region));
  assert.ok(canWalk(HOME_DOOR.x, HOME_DOOR.z, 'village'));
  const route = findRoute(SPAWN, HOME_DOOR, 'village');
  assert.ok(route.length);
  assert.equal(route.at(-1)?.x, HOME_DOOR.x);
  assert.equal(route.at(-1)?.z, HOME_DOOR.z);
});
