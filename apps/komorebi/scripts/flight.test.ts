import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FLIGHT,
  flyFor,
  startFlight,
  stepButterfly,
  stepDragonfly,
  type Bounds,
} from '../src/features/walk/lib/flight';

const bounds: Bounds = { minX: 10, maxX: 30, minZ: 40, maxZ: 60 };
function seeded(seed: number) {
  return () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
}
const SLACK = 6;
const near = (b: Bounds, x: number, z: number) =>
  x > b.minX - SLACK && x < b.maxX + SLACK && z > b.minZ - SLACK && z < b.maxZ + SLACK;

test('a butterfly wanders its garden for minutes without leaving it, and sometimes settles', () => {
  const random = seeded(3);
  let f = startFlight(bounds, random, FLIGHT.flutter);
  const modes = new Set<string>();
  const cells = new Set<string>();
  for (let i = 0; i < 60 * 180; i++) {
    f = stepButterfly(f, 1 / 60, bounds, random);
    modes.add(f.mode);
    cells.add(`${Math.floor(f.x / 4)},${Math.floor(f.z / 4)}`);
    assert.ok(near(bounds, f.x, f.z), `strayed to ${f.x.toFixed(1)}, ${f.z.toFixed(1)}`);
  }
  assert.ok(modes.has(FLIGHT.rest), 'it lands now and then');
  assert.ok(cells.size >= 12, `it explores rather than loops (${cells.size} cells)`);
});

test('a dragonfly alternates hovering and darting, stays over its water, and perches at times', () => {
  const random = seeded(11);
  let f = startFlight(bounds, random, FLIGHT.hover);
  const modes: string[] = [];
  for (let i = 0; i < 60 * 180; i++) {
    f = stepDragonfly(f, 1 / 60, bounds, random);
    if (modes.at(-1) !== f.mode) modes.push(f.mode);
    assert.ok(near(bounds, f.x, f.z));
  }
  assert.ok(modes.filter((mode) => mode === FLIGHT.dart).length > 20, 'many darts');
  assert.ok(modes.includes(FLIGHT.rest), 'perches sometimes');
});

test('two flyers from different seeds take different paths', () => {
  const a = seeded(1);
  const b = seeded(2);
  let fa = startFlight(bounds, a, FLIGHT.flutter);
  let fb = startFlight(bounds, b, FLIGHT.flutter);
  for (let i = 0; i < 600; i++) {
    fa = stepButterfly(fa, 1 / 60, bounds, a);
    fb = stepButterfly(fb, 1 / 60, bounds, b);
  }
  assert.ok(Math.hypot(fa.x - fb.x, fa.z - fb.z) > 1);
});

test('an insect flies the same at 30 and 60 frames a second', () => {
  const seeded = () => {
    let seed = 11;
    return () => {
      seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
      return seed / 4_294_967_296;
    };
  };
  const fly = (fps: number) => {
    const random = seeded();
    let state = { flight: startFlight(bounds, random, FLIGHT.flutter), clock: 0 };
    for (let frame = 0; frame < 60 * fps; frame++)
      state = flyFor(state.flight, state.clock, 1 / fps, stepButterfly, bounds, random);
    return state.flight;
  };
  const at30 = fly(30);
  const at60 = fly(60);
  assert.ok(
    Math.abs(at30.x - at60.x) < 1e-6 && Math.abs(at30.z - at60.z) < 1e-6,
    `${at30.x},${at30.z} vs ${at60.x},${at60.z}`,
  );
  assert.equal(at30.mode, at60.mode);
});
