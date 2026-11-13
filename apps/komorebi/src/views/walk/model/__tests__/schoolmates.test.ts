import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceSchoolmate,
  createSchoolmate,
  GREETING_DISTANCE,
  nearestSchoolmate,
  SCHOOL_REGION,
  SCHOOLMATE_ID,
  schoolmateGreetingPosition,
  schoolmatePlayPosition,
  SCHOOLMATES,
  schoolRegion,
} from '../schoolmates';
import { portalAt } from '../world/portals';
import { canWalk } from '../world/world';

const DT = 1 / 30;
const AWAY = { x: 0, z: 0 };

test('every playground stop leaves room for two separated players on reachable ground', () => {
  for (const spec of SCHOOLMATES) {
    for (const friend of spec.stops[SCHOOL_REGION.yard]) {
      const point = schoolmatePlayPosition({ player: friend, friend });
      assert.ok(point);
      assert.ok(Math.abs(point.x - friend.x) >= 12);
      assert.equal(point.z, friend.z);
      assert.ok(canWalk(point.x, point.z, SCHOOL_REGION.yard));
      assert.equal(portalAt(point, SCHOOL_REGION.yard), null);
    }
  }
});

test('friends ease into walking and slow before a stop rather than snapping between full speed and stillness', () => {
  const spec = SCHOOLMATES[0];
  assert.ok(spec);
  let state = { ...createSchoolmate(spec, SCHOOL_REGION.yard), wait: 0 };
  state = advanceSchoolmate(state, { spec, region: SCHOOL_REGION.yard, dt: DT, isStill: false, player: AWAY });
  assert.ok(state.speed > 0 && state.speed < spec.speed / 2);
  for (let frame = 0; frame < 60; frame++)
    state = advanceSchoolmate(state, { spec, region: SCHOOL_REGION.yard, dt: DT, isStill: false, player: AWAY });
  assert.ok(state.speed > spec.speed * 0.9);
  const target = state.path.at(-1);
  assert.ok(target);
  state = { ...state, position: { x: target.x - 0.5, z: target.z }, path: [target] };
  state = advanceSchoolmate(state, { spec, region: SCHOOL_REGION.yard, dt: DT, isStill: false, player: AWAY });
  assert.ok(state.speed < spec.speed / 2);
});

test('greeting an overlapping friend leaves room between both characters without entering furniture or a doorway', () => {
  for (const region of Object.values(SCHOOL_REGION)) {
    for (const spec of SCHOOLMATES) {
      const friend = spec.stops[region][0];
      const point = schoolmateGreetingPosition({ player: friend, friend, region });
      assert.ok(point);
      assert.ok(Math.hypot(point.x - friend.x, point.z - friend.z) >= 4.6);
      assert.ok(canWalk(point.x, point.z, region));
      assert.equal(portalAt(point, region), null);
    }
  }
  const player = { x: 23, z: 72 };
  assert.equal(schoolmateGreetingPosition({ player, friend: { x: 18, z: 72 }, region: SCHOOL_REGION.yard }), player);
});

test('only a nearby visible friend can be greeted, choosing the closest when both are within reach', () => {
  const boy = { id: SCHOOLMATE_ID.boy, x: 10, z: 10 };
  const girl = { id: SCHOOLMATE_ID.girl, x: 12, z: 10 };
  assert.equal(nearestSchoolmate([], boy), null);
  assert.equal(nearestSchoolmate([boy, girl], { x: 11.8, z: 10 }), girl.id);
  assert.equal(nearestSchoolmate([boy], { x: boy.x + GREETING_DISTANCE, z: boy.z }), null);
  assert.equal(nearestSchoolmate([boy], { x: 11, z: 10 }), boy.id);
});

test('friends follow walkable routes, rest and keep walking without entering doors', () => {
  for (const region of Object.values(SCHOOL_REGION)) {
    for (const spec of SCHOOLMATES) {
      let state = createSchoolmate(spec, region);
      const visitedStops = new Set<number>();
      let distance = 0;
      for (let frame = 0; frame < 30 * 120; frame++) {
        const before = state.position;
        state = advanceSchoolmate(state, { spec, region, dt: DT, isStill: false, player: AWAY });
        distance += Math.hypot(before.x - state.position.x, before.z - state.position.z);
        assert.ok(canWalk(state.position.x, state.position.z, region), `${spec.id} left the ${region} floor`);
        assert.equal(portalAt(state.position, region), null, `${spec.id} walked into a door`);
        spec.stops[region].forEach((stop, index) => {
          if (Math.hypot(stop.x - state.position.x, stop.z - state.position.z) < 0.01) visitedStops.add(index);
        });
      }
      assert.equal(visitedStops.size, spec.stops[region].length, `${spec.id} visits every stop in ${region}`);
      assert.ok(distance > 40, `${spec.id} keeps walking in ${region}`);
    }
  }
});

test('opening a dialog and reducing motion freeze both the route and its rest timer', () => {
  for (const spec of SCHOOLMATES) {
    const region = SCHOOL_REGION.classroom;
    const state = createSchoolmate(spec, region);
    for (const options of [
      { dt: 0, isStill: false },
      { dt: DT, isStill: true },
    ]) {
      assert.deepEqual(advanceSchoolmate(state, { spec, region, player: AWAY, ...options }), state);
    }
  }
});

test('a friend waits for the player to move instead of walking through them, then resumes', () => {
  const spec = SCHOOLMATES[0];
  assert.ok(spec);
  const region = SCHOOL_REGION.classroom;
  let state = { ...createSchoolmate(spec, region), wait: 0 };
  const player = { x: state.position.x, z: state.position.z + 3 };
  for (let frame = 0; frame < 30 * 5; frame++) {
    state = advanceSchoolmate(state, { spec, region, dt: DT, isStill: false, player });
    assert.ok(Math.hypot(state.position.x - player.x, state.position.z - player.z) >= 2.5);
  }
  const stopped = state.position;
  assert.equal(state.travel, 0);
  for (let frame = 0; frame < 30 * 2; frame++) {
    state = advanceSchoolmate(state, { spec, region, dt: DT, isStill: false, player: AWAY });
  }
  assert.ok(Math.hypot(state.position.x - stopped.x, state.position.z - stopped.z) > 2);
});

test('friends stay within the school maps and do not wander into the village or home', () => {
  assert.equal(schoolRegion('school'), SCHOOL_REGION.yard);
  assert.equal(schoolRegion('hallway'), SCHOOL_REGION.hallway);
  assert.equal(schoolRegion('classroom'), SCHOOL_REGION.classroom);
  assert.equal(schoolRegion('village'), null);
  assert.equal(schoolRegion('home'), null);
});
