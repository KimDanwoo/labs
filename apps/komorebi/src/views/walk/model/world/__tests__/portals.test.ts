import { canWalk, movePlayer } from '@views/walk/model/world/movement';
import { getWorldPortals, isInsidePortal, portalAt } from '@views/walk/model/world/portals';
import { findRoute } from '@views/walk/model/world/routing';
import type { Region } from '@views/walk/model/world/world';
import { WORLDS } from '@views/walk/model/world/worlds';
import assert from 'node:assert/strict';
import test from 'node:test';

const regions = Object.keys(WORLDS) as Region[];

type Portal = ReturnType<typeof getWorldPortals>[number];
interface Point {
  x: number;
  z: number;
}

const ARRIVAL_TOLERANCE = 0.05;
const MAX_STEP = 0.6;
const MAX_STEPS_PER_TARGET = 1000;

const walkTowards = (start: Point, target: Point, region: Region): Point => {
  let position = start;
  for (let i = 0; i < MAX_STEPS_PER_TARGET; i++) {
    const length = Math.hypot(target.x - position.x, target.z - position.z);
    if (length < ARRIVAL_TOLERANCE) break;
    const step = Math.min(length, MAX_STEP);
    position = movePlayer(
      position,
      ((target.x - position.x) / length) * step,
      ((target.z - position.z) / length) * step,
      region,
    );
  }
  return position;
};

const walkRoute = (start: Point, route: Point[], region: Region): Point =>
  route.reduce((position, target) => {
    const arrived = walkTowards(position, target, region);
    assert.ok(Math.hypot(target.x - arrived.x, target.z - arrived.z) < ARRIVAL_TOLERANCE);
    return arrived;
  }, start);

const portalsByRegion = () =>
  regions.flatMap((region) => getWorldPortals(region).map((portal) => ({ region, portal })));

test('every visible portal sits on a reachable path inside the map', () => {
  for (const { region, portal } of portalsByRegion()) {
    assert.ok(canWalk(portal.center.x, portal.center.z, region), `${region}: ${portal.node}`);
    assert.equal(portalAt(portal.center, region), portal);
    for (const start of WORLDS[region].nodes) {
      const route = findRoute(start, portal.center, region);
      assert.ok(route.length, `${region}: ${start.id} -> ${portal.node}`);
      assert.ok(isInsidePortal(walkRoute({ x: start.x, z: start.z }, route, region), portal));
    }
  }
});

const BOUNDARY_MARGIN = 0.2;
const LATERAL_STEP = 0.25;
const LATERAL_MAX = 100;

const boundaryProbe = (exit: Portal, lateral: number) => {
  const isHorizontal = exit.edge === 'left' || exit.edge === 'right';
  const isNegativeEdge = exit.edge === 'left' || exit.edge === 'top';
  const direction = isNegativeEdge ? -1 : 1;
  const outsideAt = exit.boundary + direction * BOUNDARY_MARGIN;
  const insideAt = exit.boundary - direction * BOUNDARY_MARGIN;
  return isHorizontal
    ? { outside: { x: outsideAt, z: lateral }, inside: { x: insideAt, z: lateral } }
    : { outside: { x: lateral, z: outsideAt }, inside: { x: lateral, z: insideAt } };
};

const countBoundaryCrossings = (region: Region, exit: Portal) => {
  let crossings = 0;
  for (let lateral = 0; lateral <= LATERAL_MAX; lateral += LATERAL_STEP) {
    const { outside, inside } = boundaryProbe(exit, lateral);
    if (!canWalk(outside.x, outside.z, region)) continue;
    if (!canWalk(inside.x, inside.z, region)) continue;
    assert.equal(isInsidePortal(inside, exit), false);
    const covered = lateral >= exit.lateralRange[0] && lateral <= exit.lateralRange[1];
    assert.equal(isInsidePortal(outside, exit), covered);
    crossings++;
  }
  return crossings;
};

test('exit boundaries span the full walkable road width', () => {
  for (const { region, portal: exit } of portalsByRegion())
    assert.ok(countBoundaryCrossings(region, exit) > 1, `${region}: ${exit.node} has no usable boundary`);
});

test('portal arrivals land on ground outside all return portals, without a timed lockout', () => {
  for (const { region, portal } of portalsByRegion()) {
    assert.ok(canWalk(portal.spawn.x, portal.spawn.z, portal.to));
    assert.equal(portalAt(portal.spawn, portal.to), null, `${region} -> ${portal.to} bounces back`);
  }
});

const SAMPLE_SPACING = 0.1;

const assertNoReturnAlong = (from: Point, target: Point, origin: Region, arrival: Portal, destination: Portal) => {
  const steps = Math.max(1, Math.ceil(Math.hypot(target.x - from.x, target.z - from.z) / SAMPLE_SPACING));
  for (let i = 0; i <= steps; i++) {
    const point = {
      x: from.x + ((target.x - from.x) * i) / steps,
      z: from.z + ((target.z - from.z) * i) / steps,
    };
    const entered = portalAt(point, arrival.to);
    assert.ok(
      !entered || entered === destination,
      `${origin} -> ${arrival.to} -> ${destination.to} returns through ${entered?.to}`,
    );
  }
};

test('leaving an arrival point for another exit never walks back into the return portal', () => {
  for (const { region: origin, portal: arrival } of portalsByRegion()) {
    for (const destination of getWorldPortals(arrival.to)) {
      if (destination.to === origin) continue;
      const route = findRoute(arrival.spawn, destination.center, arrival.to);
      assert.ok(route.length);
      let position: Point = arrival.spawn;
      for (const target of route) {
        assertNoReturnAlong(position, target, origin, arrival, destination);
        position = target;
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
