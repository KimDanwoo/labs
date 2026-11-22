import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  climbSpeed,
  cruiseSpeed,
  FLIGHT_ALTITUDE,
  hasTouchedDown,
  landingSpeed,
  leanAngles,
  steerAltitude,
  takeoffAltitude,
} from '@views/drive/lib/engine/game/physics/flightControl';

const GROUND = 2;
const CRUISE = 6;
const STEP = 0.1;
const TREE_TOP = 7;
const AFLOAT = 0.4;
const HIGH = 6;
const HALF = 0.5;
const FAST = 20;

describe('flightControl', () => {
  it('이륙하면 지금 높이보다 위를 목표로 잡고 천장을 넘지 않는다', () => {
    assert.equal(takeoffAltitude(GROUND), GROUND + FLIGHT_ALTITUDE.takeoff);
    assert.equal(takeoffAltitude(FLIGHT_ALTITUDE.ceiling), FLIGHT_ALTITUDE.ceiling);
  });

  it('손을 떼면 목표 높이를 그대로 유지한다', () => {
    assert.equal(steerAltitude({ target: CRUISE, ground: GROUND, input: 0, delta: STEP }), CRUISE);
  });

  it('상승·하강 키로 목표가 움직이되 천장과 바닥 여유를 넘지 않는다', () => {
    assert.ok(steerAltitude({ target: CRUISE, ground: GROUND, input: 1, delta: STEP }) > CRUISE);
    assert.ok(steerAltitude({ target: CRUISE, ground: GROUND, input: -1, delta: STEP }) < CRUISE);
    const ceiling = FLIGHT_ALTITUDE.ceiling;
    assert.equal(steerAltitude({ target: ceiling, ground: GROUND, input: 1, delta: STEP }), ceiling);
    const floor = GROUND + FLIGHT_ALTITUDE.clearance;
    assert.equal(steerAltitude({ target: floor, ground: GROUND, input: -1, delta: STEP }), floor);
  });

  it('나무 위를 지날 때는 잠깐 올라가지만 목표 높이는 바꾸지 않는다', () => {
    const clearing = climbSpeed({ elevation: CRUISE, ground: TREE_TOP, target: CRUISE });
    const cruising = climbSpeed({ elevation: CRUISE, ground: GROUND, target: TREE_TOP + FLIGHT_ALTITUDE.clearance });
    assert.ok(clearing > cruising);
    assert.equal(steerAltitude({ target: CRUISE, ground: TREE_TOP, input: 0, delta: STEP }), CRUISE);
  });

  it('목표 높이에 있으면 수직 속도를 0으로 맞춘다', () => {
    assert.equal(climbSpeed({ elevation: CRUISE, ground: GROUND, target: CRUISE }), 0);
  });

  it('착륙은 높을수록 빨리, 땅 가까이선 천천히 내려온다', () => {
    const fromHigh = landingSpeed({ elevation: CRUISE, ground: GROUND });
    const nearGround = landingSpeed({ elevation: GROUND + FLIGHT_ALTITUDE.rest, ground: GROUND });
    assert.ok(fromHigh < nearGround);
    assert.ok(nearGround < 0);
  });

  it('바퀴가 닿거나 물에 내려앉으면 착륙이 끝난다', () => {
    assert.equal(hasTouchedDown({ elevation: HIGH, wheelContacts: 0 }), false);
    assert.equal(hasTouchedDown({ elevation: HIGH, wheelContacts: 1 }), true);
    assert.equal(hasTouchedDown({ elevation: AFLOAT, wheelContacts: 0 }), true);
  });

  it('손을 떼면 제자리에 멈추고, 뒤로는 앞보다 느리며 부스트는 더 빠르다', () => {
    assert.equal(cruiseSpeed(0, 1), 0);
    const ahead = cruiseSpeed(1, 0);
    assert.ok(ahead > 0);
    assert.ok(Math.abs(cruiseSpeed(-1, 0)) < ahead);
    assert.ok(cruiseSpeed(-1, 0) < 0);
    assert.ok(cruiseSpeed(1, 1) > ahead);
  });

  it('나아가는 쪽으로 기수를 숙이고, 움직일 때만 도는 쪽으로 기운다', () => {
    assert.deepEqual(leanAngles(0, 1), { pitch: 0, bank: 0 });
    const forward = leanAngles(cruiseSpeed(1, 0), 1);
    const backward = leanAngles(cruiseSpeed(-1, 0), 0);
    assert.ok(forward.pitch > 0);
    assert.ok(backward.pitch < 0);
    assert.ok(forward.bank > 0);
    assert.ok(leanAngles(cruiseSpeed(1, 0), -1).bank < 0);
    assert.ok(leanAngles(cruiseSpeed(HALF, 0), 1).bank < forward.bank);
    assert.deepEqual(leanAngles(FAST, 1), forward);
  });
});
