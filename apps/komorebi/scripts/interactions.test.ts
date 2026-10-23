import assert from 'node:assert/strict';
import test from 'node:test';
import { interactionDestination, isNearHomeBed } from '../src/shared/world/interactions';
import { HOME_BED, HOME_DESK, LANDMARKS, canWalk, findRoute } from '../src/shared/world/world';

test('solid home furniture routes to usable floor instead of sending the child into it', () => {
  assert.equal(interactionDestination({ x: 1160 / 15.36, z: 720 / 10.24 }, 'home'), HOME_BED);
  assert.equal(interactionDestination({ x: 600 / 15.36, z: 500 / 10.24 }, 'home'), HOME_DESK);
  for (const target of [HOME_BED, HOME_DESK]) {
    assert.ok(canWalk(target.x, target.z, 'home'));
    assert.ok(findRoute({ x: 36, z: 70 }, target, 'home').length > 0);
  }
  assert.equal(interactionDestination({ x: 50, z: 20 }, 'home'), null);
  assert.equal(interactionDestination({ x: 1160 / 15.36, z: 720 / 10.24 }, 'coast'), null);
});

test('every outdoor place has a walkable interaction destination', () => {
  for (const place of LANDMARKS) {
    assert.equal(interactionDestination(place, place.region), place);
    assert.ok(canWalk(place.x, place.z, place.region), place.id);
  }
});

test('the quilt can be used from either side and the foot, but not across the room', () => {
  for (const point of [{ x: 70, z: 70 }, { x: 82, z: 70 }, { x: 76, z: 77 }, HOME_BED]) {
    assert.ok(isNearHomeBed(point), JSON.stringify(point));
  }
  assert.equal(isNearHomeBed(HOME_DESK), false);
  assert.equal(isNearHomeBed({ x: 90, z: 90 }), false);
});
