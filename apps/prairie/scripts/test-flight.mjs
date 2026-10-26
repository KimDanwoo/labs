import assert from 'node:assert/strict';
import test from 'node:test';
import { createFlightState, updateFlight, FLIGHT } from '../src/features/runner-control/model/services/flightDynamics.ts';
const controls = { lift: false, launch: false, descend: false, holdAltitude: false, speed: 12 };
const airborne = (height = 12, velocity = 0) => ({ height, velocity, groundY: 0 });
function simulate(state, seconds, fps, input = controls, ground = 0) {
  const impacts = [];
  for (let i = 0; i < seconds * fps; i++) {
    const impact = updateFlight(state, input, ground, 1 / fps);
    if (impact !== null) impacts.push(impact);
    assert.ok(Number.isFinite(state.height) && Number.isFinite(state.velocity));
    assert.ok(state.height >= 0);
  }
  return impacts;
}

test('releasing ascent eases through the apex instead of dropping instantly', () => {
  const state = airborne(12, 5);
  updateFlight(state, controls, 0, 1 / 60);
  assert.ok(state.velocity > 4);
  simulate(state, 2, 60);
  assert.ok(state.velocity < 0 && state.velocity >= -FLIGHT.glideSlow);
});
test('commanded descent is faster, but both modes flare and land once', () => {
  for (const descend of [false, true]) {
    const state = airborne(20);
    const input = { ...controls, descend };
    simulate(state, 1, 60, input);
    assert.ok(descend ? state.velocity < -5 : state.velocity < -4 && state.velocity > -6);
    const impacts = simulate(state, 40, 60, input);
    assert.equal(impacts.length, 1);
    assert.ok(impacts[0] < 1.6, `touchdown ${impacts[0]}`);
    assert.equal(state.height, 0);
    assert.equal(state.velocity, 0);
  }
});
test('30/60/120 fps produce the same flight trajectory', () => {
  const states = [30, 60, 120].map((fps) => {
    const state = airborne(20, 4);
    simulate(state, 4, fps);
    return state;
  });
  assert.ok(Math.max(...states.map(s => s.height)) - Math.min(...states.map(s => s.height)) < 0.01);
});
test('terrain changes preserve airborne world altitude and rising terrain lands safely', () => {
  const state = airborne(12);
  updateFlight(state, { ...controls, holdAltitude: true }, -5, 1 / 60);
  assert.equal(state.height - 5, 12);
  updateFlight(state, { ...controls, holdAltitude: true }, 5, 1 / 60);
  assert.equal(state.height + 5, 12);
  assert.notEqual(updateFlight(state, controls, 15, 1 / 60), null);
  assert.equal(state.height, 0);
});
test('grounded rider follows terrain and only a new press launches', () => {
  const state = createFlightState();
  simulate(state, 1, 60, { ...controls, lift: true }, 6);
  assert.equal(state.height, 0);
  updateFlight(state, { ...controls, lift: true, launch: true }, 6, 1 / 60);
  assert.ok(state.height > 0);
  simulate(state, 30, 60, { ...controls, lift: true }, 6);
  assert.ok(Math.abs(state.height - FLIGHT.ceiling) < 0.1);
});
test('takeoff requires a forward run-up; standing, walking and reversing cannot launch', () => {
  for (const speed of [0, 3, FLIGHT.minTakeoffRunSpeed - 0.01, -12]) {
    const state = createFlightState();
    simulate(state, 1, 60, { ...controls, speed, lift: true, launch: true });
    assert.equal(state.height, 0);
    assert.equal(state.velocity, 0);
  }
  const state = createFlightState();
  updateFlight(state, { ...controls, speed: FLIGHT.minTakeoffRunSpeed, lift: true, launch: true }, 0, 1 / 60);
  assert.ok(state.height > 0);
});
test('an early held press does not auto-launch, and low speed does not disable airborne lift', () => {
  const state = createFlightState();
  updateFlight(state, { ...controls, speed: 0, lift: true, launch: true }, 0, 1 / 60);
  simulate(state, 1, 60, { ...controls, lift: true });
  assert.equal(state.height, 0);
  updateFlight(state, { ...controls, lift: true, launch: true }, 0, 1 / 60);
  assert.ok(state.height > 0);
  simulate(state, 1, 60, { ...controls, speed: 0, lift: true });
  assert.ok(state.height > 4);
});
test('skill altitude hold eases a fall without teleporting; malformed delta is ignored', () => {
  const state = airborne(20, -2);
  updateFlight(state, { ...controls, holdAltitude: true }, 0, 1 / 60);
  assert.ok(state.velocity < 0 && state.velocity > -2);
  simulate(state, 3, 60, { ...controls, holdAltitude: true });
  assert.ok(Math.abs(state.velocity) < 0.01);
  const before = { ...state };
  for (const delta of [0, -1, NaN, Infinity]) updateFlight(state, controls, 0, delta);
  assert.deepEqual(state, before);
});

test('released flight from ring altitude lands promptly even without forward input', () => {
  for (const speed of [0, 12, 18]) {
    const state = airborne(25, 5.5);
    const impacts = simulate(state, 8, 60, { ...controls, speed });
    assert.equal(state.height, 0, `still floating at speed ${speed}`);
    assert.equal(impacts.length, 1);
    assert.ok(impacts[0] < 1.6);
  }
});
