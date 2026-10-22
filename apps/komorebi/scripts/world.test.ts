import assert from 'node:assert/strict';
import test from 'node:test';
import { hasGroundBetween, isOnGround } from '../src/shared/world/ground';
import {
  LANDMARKS,
  SPAWN,
  WORLDS,
  canWalk,
  closestLandmark,
  createSlideMotion,
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
  assert.ok(intoWater.z < 51);
});
test('large movements cannot tunnel from the bridge through the river to the foreground lane', () => {
  const next = movePlayer({ x: 50, z: 47 }, 0, 35, 'river');
  assert.ok(next.z < 51);
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

test('the full bridge deck is usable while railings and water remain blocked', () => {
  for (const x of [36, 45, 55, 65]) {
    for (const z of [45.8, 47, 48.5]) assert.ok(canWalk(x, z, 'river'), `${x},${z}`);
    for (const z of [44, 51.5, 53]) assert.equal(canWalk(x, z, 'river'), false);
  }
  for (const x of [86, 90, 94]) {
    const deck = 42.8 + ((x - 82) / 14) * (39.5 - 42.8);
    assert.ok(canWalk(x, deck, 'village'));
    for (const offset of [-3, 3]) assert.equal(canWalk(x, deck + offset, 'village'), false);
  }
  for (const dz of [-20, 20]) {
    const next = movePlayer({ x: 50, z: 47.7 }, 8, dz, 'river');
    assert.ok(next.z > 45 && next.z < 51);
  }
});

test('painted ground is walkable even outside the old guide lanes in all six maps', () => {
  for (const region of Object.keys(WORLDS) as Region[]) {
    for (let x = 3.17; x <= 97; x += 0.7) {
      for (let z = 30.13; z <= 98; z += 0.7) {
        assert.equal(canWalk(x, z, region), isOnGround(x, z, region), `${region}: ${x},${z}`);
      }
    }
  }
});

test('painted shrubs, fences, playground equipment and verges reject entry', () => {
  // Pixel samples from the original artwork, independent of the navigation data.
  const obstacles: [Region, number, number][] = [
    ['shops', 370, 710],
    ['shops', 540, 720],
    ['shops', 1060, 710],
    ['village', 630, 695],
    ['village', 676, 625],
    ['village', 890, 800],
    ['river', 400, 560],
    ['river', 245, 730],
    ['river', 200, 950],
    ['river', 280, 1000],
    ['coast', 850, 366],
    ['coast', 1000, 640],
    ['coast', 600, 840],
    ['forest', 620, 950],
    ['forest', 1300, 865],
    ['school', 1350, 560],
    ['school', 230, 560],
  ];
  for (const [region, x, y] of obstacles)
    assert.equal(canWalk(x / 15.36, y / 10.24, region), false, `${region}: ${x},${y}`);
});

test('holding movement toward the pictured shop hedge stops on the road even at sprint speed', () => {
  for (const dx of [-0.25, 0, 0.25]) {
    let position = { x: 24, z: 57 };
    for (let i = 0; i < 120; i++) {
      position = movePlayer(position, dx, 45 / 20, 'shops');
      assert.ok(canWalk(position.x, position.z, 'shops'));
    }
    if (position.x < 30) assert.ok(position.z < 66, `walked into hedge: ${JSON.stringify(position)}`);
  }
  assert.deepEqual(findRoute({ x: 24, z: 57 }, { x: 24, z: 71 }, 'shops'), []);
});

test('click routes from lane edges do not cut through the new ground boundaries', () => {
  for (const region of Object.keys(WORLDS) as Region[]) {
    const destination = LANDMARKS.find((point) => point.region === region)!;
    for (let x = 1; x < 100; x += 3) {
      for (let z = 22; z < 100; z += 3) {
        if (!canWalk(x, z, region)) continue;
        const route = findRoute({ x, z }, destination, region);
        assert.ok(route.length, `${region}: no route from ${x},${z}`);
        let position = { x, z };
        for (const target of route) {
          const length = Math.hypot(target.x - position.x, target.z - position.z);
          const steps = Math.max(1, Math.ceil(length / 0.2));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            assert.ok(
              canWalk(position.x + (target.x - position.x) * t, position.z + (target.z - position.z) * t, region),
              `${region}: route from ${x},${z} crosses obstacle at ${position.x + (target.x - position.x) * t},${position.z + (target.z - position.z) * t}; segment ${JSON.stringify(position)} -> ${JSON.stringify(target)}`,
            );
          }
          position = target;
        }
      }
    }
  }
});

test('road shoulders, plazas and upper paths work beyond the old narrow guide routes', () => {
  const destinations: [Region, number, number][] = [
    ['village', 46, 58],
    ['river', 27, 72],
    ['coast', 65, 67],
    ['forest', 38, 64],
    ['forest', 50, 42],
    ['school', 68, 42],
    ['shops', 65, 80],
    // Independent points on the painting: pavements, side gate, stairs and harbour.
    ...(
      [
        ['shops', 800, 265],
        ['shops', 590, 475],
        ['shops', 1080, 525],
        ['village', 1450, 320],
        ['village', 220, 390],
        ['village', 440, 430],
        ['river', 1200, 490],
        ['river', 800, 512],
        ['river', 330, 880],
        ['coast', 800, 670],
        ['coast', 600, 780],
        ['coast', 300, 860],
        ['coast', 475, 950],
        ['coast', 450, 500],
        ['coast', 850, 345],
        ['forest', 290, 860],
        ['forest', 1320, 690],
        ['forest', 650, 418],
        ['school', 190, 620],
        ['school', 70, 680],
        ['school', 620, 380],
        ['school', 1200, 810],
      ] as [Region, number, number][]
    ).map(([region, x, y]): [Region, number, number] => [region, x / 15.36, y / 10.24]),
  ];
  for (const [region, x, z] of destinations) {
    assert.ok(canWalk(x, z, region), `${region}: ${x},${z}`);
    const landmark = LANDMARKS.find((point) => point.region === region)!;
    for (const [start, end] of [
      [landmark, { x, z }],
      [{ x, z }, landmark],
    ]) {
      const route = findRoute(start!, end!, region);
      assert.ok(route.length, `${region}: no click route`);
      let position = { x: start!.x, z: start!.z };
      for (const target of route) {
        for (let i = 0; i < 1000; i++) {
          const distance = Math.hypot(target.x - position.x, target.z - position.z);
          if (distance < 0.05) break;
          const step = Math.min(0.5, distance);
          position = movePlayer(
            position,
            ((target.x - position.x) / distance) * step,
            ((target.z - position.z) / distance) * step,
            region,
          );
        }
        assert.ok(Math.hypot(target.x - position.x, target.z - position.z) < 0.05, `${region}: stuck`);
      }
    }
  }
});

test('the cleared school approach can be crossed at every depth without stopping', () => {
  for (let z = 55; z <= 62; z += 0.5) {
    for (const direction of [-1, 1]) {
      let position = { x: direction < 0 ? 43 : 3.5, z };
      const targetX = direction < 0 ? 3.5 : 43;
      for (let i = 0; i < 160; i++) {
        const dx = direction * Math.min(0.4, Math.abs(targetX - position.x));
        if (Math.abs(dx) < 0.0001) break;
        const next = movePlayer(position, dx, 0, 'shops');
        assert.ok(Math.abs(next.x - position.x) > 0.001, `school road stuck at ${JSON.stringify(position)}`);
        position = next;
      }
      assert.ok(Math.abs(position.x - targetX) < 0.01);
    }
  }
});

test('holding into a verge slides along connected ground without stopping or crossing obstacles', () => {
  for (const [region, x, z, dx, dz] of [
    ['shops', 24, 60, 0, 0.25],
    ['river', 50, 47, 0, 0.25],
    ['coast', 70, 73, 0, -0.25],
  ] as [Region, number, number, number, number][]) {
    let position = { x, z };
    for (let i = 0; i < 120; i++) {
      const next = movePlayer(position, dx, dz, region);
      const distance = Math.hypot(next.x - position.x, next.z - position.z);
      assert.ok(distance > 0.24 && distance <= 0.25001, `${region}: stalled or accelerated`);
      assert.ok(hasGroundBetween(position, next, region), `${region}: cut across an obstacle`);
      assert.ok((next.x - position.x) * dx + (next.z - position.z) * dz >= -1e-8, `${region}: reversed input`);
      position = next;
    }
    assert.ok(Math.abs(position.x - x) > 10, `${region}: failed to guide along the road`);
    assert.deepEqual(movePlayer(position, 0, 0, region), position);
  }
});

test('the open coast junction leads from the road to the boat quay and back', () => {
  const quay = { x: 850 / 15.36, z: 345 / 10.24 };
  for (const [px, py] of [
    [350, 600],
    [550, 600],
    [750, 600],
    [600, 480],
    [650, 520],
  ]) {
    const entrance = { x: px! / 15.36, z: py! / 10.24 };
    assert.ok(canWalk(entrance.x, entrance.z, 'coast'));
    for (const [from, to] of [
      [entrance, quay],
      [quay, entrance],
    ]) {
      const route = findRoute(from!, to!, 'coast');
      assert.ok(route.length);
      let position = from!;
      for (const target of route) {
        for (let i = 0; i < 1000; i++) {
          const distance = Math.hypot(target.x - position.x, target.z - position.z);
          if (distance < 0.02) break;
          const step = Math.min(0.3, distance);
          const next = movePlayer(
            position,
            ((target.x - position.x) / distance) * step,
            ((target.z - position.z) / distance) * step,
            'coast',
          );
          assert.ok(hasGroundBetween(position, next, 'coast'));
          position = next;
        }
        assert.ok(Math.hypot(target.x - position.x, target.z - position.z) < 0.02, 'harbour route stuck');
      }
    }
  }
  for (const [px, py] of [
    [750, 480],
    [780, 520],
    [850, 450],
  ])
    assert.equal(canWalk(px! / 15.36, py! / 10.24, 'coast'), false);
});

test('steady input stays straight on open ground and slides without alternating sides', () => {
  const flat = createSlideMotion();
  let position = { x: 50, z: 50 };
  for (let i = 0; i < 100; i++) {
    position = movePlayer(position, 0, 0.2, 'school', flat);
    assert.equal(position.x, 50);
  }
  const slide = createSlideMotion();
  position = { x: 50, z: 47 };
  let sideways = 0;
  for (let i = 0; i < 100; i++) {
    const next = movePlayer(position, 0, 0.25, 'river', slide);
    const lateral = next.x - position.x;
    if (Math.abs(lateral) > 0.001) {
      if (sideways) assert.equal(Math.sign(lateral), sideways, 'slide reversed under steady input');
      sideways = Math.sign(lateral);
    }
    assert.ok(hasGroundBetween(position, next, 'river'));
    position = next;
  }
  assert.notEqual(sideways, 0);
  movePlayer(position, 0, 0, 'river', slide);
  assert.equal(slide.direction, null);
  const reversed = movePlayer(position, -0.2, 0, 'river', slide);
  assert.ok(reversed.x < position.x, 'changing direction must release the old slide');
});
