import assert from 'node:assert/strict';
import test from 'node:test';
import { FLIGHT, startFlight, stepButterfly, stepDragonfly, type Bounds } from '../src/features/walk/lib/flight';

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
