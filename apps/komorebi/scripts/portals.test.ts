import assert from 'node:assert/strict';
import test from 'node:test';
import { getWorldPortals, isInsidePortal, portalAt } from '../src/shared/world/portals';
import { WORLDS, canWalk, findRoute, movePlayer, type Region } from '../src/shared/world/world';

const regions = Object.keys(WORLDS) as Region[];

test('every visible portal sits on a reachable path inside the map', () => {
  for (const region of regions) {
    for (const portal of getWorldPortals(region)) {
      assert.ok(canWalk(portal.center.x, portal.center.z, region), `${region}: ${portal.node}`);
      assert.equal(portalAt(portal.center, region), portal);
      for (const start of WORLDS[region].nodes) {
        const route = findRoute(start, portal.center, region);
        assert.ok(route.length, `${region}: ${start.id} -> ${portal.node}`);
        let position = { x: start.x, z: start.z };
        for (const target of route) {
          for (let i = 0; i < 1000; i++) {
            const length = Math.hypot(target.x - position.x, target.z - position.z);
            if (length < 0.05) break;
            const step = Math.min(length, 0.6);
            position = movePlayer(
              position,
              ((target.x - position.x) / length) * step,
              ((target.z - position.z) / length) * step,
              region,
            );
          }
          assert.ok(Math.hypot(target.x - position.x, target.z - position.z) < 0.05);
        }
        assert.ok(isInsidePortal(position, portal));
      }
    }
  }
});

test('exit boundaries span the full walkable road width', () => {
  for (const region of regions)
    for (const exit of getWorldPortals(region)) {
      let crossings = 0;
      for (let lateral = 0; lateral <= 100; lateral += 0.25) {
        const horizontal = exit.edge === 'left' || exit.edge === 'right';
        const direction = exit.edge === 'left' || exit.edge === 'top' ? -1 : 1;
        const outside = horizontal
          ? { x: exit.boundary + direction * 0.2, z: lateral }
          : { x: lateral, z: exit.boundary + direction * 0.2 };
        const inside = horizontal
          ? { ...outside, x: exit.boundary - direction * 0.2 }
          : { ...outside, z: exit.boundary - direction * 0.2 };
        if (!canWalk(outside.x, outside.z, region) || !canWalk(inside.x, inside.z, region)) continue;
        assert.equal(isInsidePortal(inside, exit), false);
        const expected = lateral >= exit.lateralRange[0] && lateral <= exit.lateralRange[1] ? exit : null;
        assert.equal(portalAt(outside, region), expected);
        crossings++;
      }
      assert.ok(crossings > 1, `${region}: ${exit.node} has no usable boundary`);
    }
});

test('portal arrivals land on ground outside all return portals, without a timed lockout', () => {
  for (const region of regions) {
    for (const portal of getWorldPortals(region)) {
      assert.ok(canWalk(portal.spawn.x, portal.spawn.z, portal.to));
      assert.equal(portalAt(portal.spawn, portal.to), null, `${region} -> ${portal.to} bounces back`);
    }
  }
});

test('leaving an arrival point for another exit never walks back into the return portal', () => {
  for (const origin of regions) {
    for (const arrival of getWorldPortals(origin)) {
      for (const destination of getWorldPortals(arrival.to)) {
        if (destination.to === origin) continue;
        const route = findRoute(arrival.spawn, destination.center, arrival.to);
        assert.ok(route.length);
        let position = arrival.spawn;
        for (const target of route) {
          const steps = Math.max(1, Math.ceil(Math.hypot(target.x - position.x, target.z - position.z) / 0.1));
          for (let i = 0; i <= steps; i++) {
            const point = {
              x: position.x + ((target.x - position.x) * i) / steps,
              z: position.z + ((target.z - position.z) * i) / steps,
            };
            const entered = portalAt(point, arrival.to);
            assert.ok(
              !entered || entered === destination,
              `${origin} -> ${arrival.to} -> ${destination.to} returns through ${entered?.to}`,
            );
          }
          position = target;
        }
      }
    }
  }
});

test('the village far-bank path is reachable without entering the river portal', () => {
  const start = { x: 62, z: 51 };
  const target = { x: 1450 / 15.36, z: 320 / 10.24 };
  const route = findRoute(start, target, 'village');
  assert.ok(route.length);
  let position = start;
  for (const next of route) {
    const steps = Math.ceil(Math.hypot(next.x - position.x, next.z - position.z) / 0.1);
    for (let i = 0; i <= steps; i++) {
      assert.equal(
        portalAt(
          { x: position.x + ((next.x - position.x) * i) / steps, z: position.z + ((next.z - position.z) * i) / steps },
          'village',
        ),
        null,
      );
    }
    position = next;
  }
});

test('passing a different road at the same screen edge does not transfer regions', () => {
  const sidePath = { x: 97.5, z: 34.5 };
  assert.ok(canWalk(sidePath.x, sidePath.z, 'village'));
  assert.equal(portalAt(sidePath, 'village'), null);
  for (const region of regions)
    for (const exit of getWorldPortals(region)) {
      assert.ok(!/[←→↑↓]/.test(exit.label));
      assert.ok(!exit.label.endsWith('로'));
    }
});
