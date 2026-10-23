import assert from 'node:assert/strict';
import test from 'node:test';
import { FOREGROUNDS, isForegroundInFront } from '../src/shared/world/foreground';
import { hasGroundBetween } from '../src/shared/world/ground';
import { WORLD_OBJECTS } from '../src/shared/world/objects';
import { canWalk, createSlideMotion, findRoute, movePlayer } from '../src/shared/world/world';

const point = (x: number, y: number) => ({ x: x / 15.36, z: y / 10.24 });

test('shrine gate bases are solid while the central opening and rear walkway stay open', () => {
  for (const x of [695, 883]) assert.equal(canWalk(x / 15.36, 430 / 10.24, 'forest'), false);
  for (const [x, y] of [
    [725, 430],
    [790, 430],
    [850, 430],
    [695, 400],
    [883, 405],
  ]) {
    assert.equal(canWalk(x! / 15.36, y! / 10.24, 'forest'), true);
  }
});

test('click paths go around both pillars and long segments cannot tunnel through their bases', () => {
  for (const [left, right] of [
    [670, 725],
    [850, 915],
  ]) {
    const from = point(left!, 430),
      target = point(right!, 430);
    assert.equal(hasGroundBetween(from, target, 'forest'), false);
    const route = findRoute(from, target, 'forest');
    assert.ok(route.length > 1);
    let previous = from;
    for (const next of route) {
      assert.ok(hasGroundBetween(previous, next, 'forest'));
      previous = next;
    }
    assert.deepEqual(previous, target);
  }
});

test('holding movement against a gate pillar slides around it without crossing the solid base', () => {
  let position = point(670, 430);
  const slide = createSlideMotion();
  for (let step = 0; step < 50; step++) {
    const next = movePlayer(position, 0.1, 0, 'forest', slide);
    assert.ok(hasGroundBetween(position, next, 'forest'));
    position = next;
  }
  assert.ok(position.x > 715 / 15.36);
});

test('each pillar silhouette hides a character behind it, never one in front', () => {
  for (const object of WORLD_OBJECTS.filter((object) => object.region === 'forest')) {
    const layer = FOREGROUNDS.find((candidate) => candidate.outline === object.outline);
    assert.ok(layer);
    const x = object.footprint[0]![0] + 10;
    assert.equal(isForegroundInFront(layer, point(x, 405), 'forest'), true);
    assert.equal(isForegroundInFront(layer, point(x, 450), 'forest'), false);
    assert.equal(isForegroundInFront(layer, point(x, 405), 'village'), false);
  }
});
