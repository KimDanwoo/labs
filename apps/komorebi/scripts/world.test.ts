import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LANDMARKS,
  SPAWN,
  WORLDS,
  canWalk,
  closestLandmark,
  distanceToSegment,
  findRoute,
  movePlayer,
  nextRegionStep,
  type Region,
} from '../src/shared/world/world';

test('spawn, every landmark and every portal arrival are on walkable lanes', () => {
  assert.ok(canWalk(SPAWN.x, SPAWN.z));
  for (const point of LANDMARKS) assert.ok(canWalk(point.x, point.z, point.region), point.id);
  for (const world of Object.values(WORLDS))
    for (const portal of world.portals) assert.ok(canWalk(portal.spawn.x, portal.spawn.z, portal.to));
});
test('water, sky and off-map coordinates are not walkable', () => {
  for (const point of [
    { x: 70, z: 72 },
    { x: 90, z: 70 },
    { x: 50, z: 10 },
    { x: -1, z: 85 },
    { x: 101, z: 85 },
  ])
    assert.equal(canWalk(point.x, point.z), false);
});
test('the bridge allows horizontal crossing but stops entry into the river', () => {
  const across = movePlayer({ x: 40, z: 47 }, 20, 0, 'river');
  assert.ok(Math.abs(across.x - 60) < 1e-8);
  const intoWater = movePlayer({ x: 50, z: 47 }, 0, 15, 'river');
  assert.ok(intoWater.z < 50);
});
test('large movements cannot tunnel from the bridge through the river to the foreground lane', () => {
  const next = movePlayer({ x: 50, z: 47 }, 0, 35, 'river');
  assert.ok(next.z < 50);
});
test('all lane graph routes can actually be followed without leaving walkable ground', () => {
  for (const region of Object.keys(WORLDS) as Region[]) {
    const world = WORLDS[region];
    for (const from of world.nodes)
      for (const to of world.nodes) {
        const route = findRoute(from, to, region);
        assert.ok(route.length, `${region}: ${from.id} -> ${to.id}`);
        let position = { x: from.x, z: from.z };
        for (const target of route) {
          for (let i = 0; i < 1200 && Math.hypot(target.x - position.x, target.z - position.z) > 0.05; i++) {
            const dx = target.x - position.x,
              dz = target.z - position.z,
              d = Math.hypot(dx, dz),
              step = Math.min(d, 0.2);
            position = movePlayer(position, (dx / d) * step, (dz / d) * step, region);
            assert.ok(canWalk(position.x, position.z, region));
          }
          assert.ok(
            Math.hypot(target.x - position.x, target.z - position.z) <= 0.05,
            `${region}: ${from.id} -> ${to.id} stuck`,
          );
        }
      }
  }
});
test('discoveries require the correct region and proximity', () => {
  for (const point of LANDMARKS) assert.equal(closestLandmark(point.x, point.z, point.region)?.id, point.id);
  assert.equal(closestLandmark(SPAWN.x, SPAWN.z), null);
  assert.equal(closestLandmark(64, 82, 'forest'), null);
});

test('every region can guide the walker to every other region without loops', () => {
  const regions = Object.keys(WORLDS) as Region[];
  for (const from of regions)
    for (const to of regions) {
      let current = from;
      const visited = new Set<Region>();
      while (current !== to) {
        assert.ok(!visited.has(current), `${from} -> ${to} loops at ${current}`);
        visited.add(current);
        const next = nextRegionStep(current, to);
        assert.ok(next && WORLDS[current].portals.some((p) => p.to === next));
        current = next;
      }
    }
});

test('bridge collision stays between painted railings, including diagonal input', () => {
  // Bounds traced from the 1536 x 1024 background artwork, in map percentages.
  for (let x = 36; x <= 66; x += 0.5) {
    for (let z = 40; z <= 55; z += 0.1) {
      if (canWalk(x, z, 'river')) assert.ok(z >= 46 && z <= 49, `river ${x},${z}`);
    }
  }
  for (let x = 84; x <= 94; x += 0.25) {
    const deck = 42.8 + ((x - 82) / 14) * (39.5 - 42.8);
    for (const offset of [-2, -1.2, 1.2, 2])
      assert.equal(canWalk(x, deck + offset, 'village'), false, `village ${x},${offset}`);
    assert.ok(canWalk(x, deck, 'village'));
  }
  for (const dz of [-20, 20]) {
    const next = movePlayer({ x: 50, z: 47.7 }, 8, dz, 'river');
    assert.ok(next.z >= 46 && next.z <= 49);
  }
});

test('cached collision matches the authored lane geometry throughout all six maps', () => {
  for (const region of Object.keys(WORLDS) as Region[]) {
    const world = WORLDS[region];
    for (let x = 0.17; x <= 100; x += 0.7) {
      for (let z = 28.13; z <= 100; z += 0.7) {
        const inBounds = x >= 3 && x <= 97 && z >= 30 && z <= 98;
        const expected =
          inBounds &&
          (world.areas?.some((a) => x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ) ||
            world.routes.some((route) => {
              const a = world.nodes.find((n) => n.id === route.a)!;
              const b = world.nodes.find((n) => n.id === route.b)!;
              return distanceToSegment({ x, z }, a, b) <= route.width;
            }));
        assert.equal(canWalk(x, z, region), Boolean(expected), `${region}: ${x},${z}`);
      }
    }
  }
});
