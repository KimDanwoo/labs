import { AREA_FOOTPRINTS } from '../../src/views/drive/lib/engine/game/world/layout/areaFootprints';
import {
  closedCurve,
  loopDistance,
  segmentDistance,
  signedLoopDistance,
} from '../../src/views/drive/lib/engine/game/world/layout/curves';
import {
  AREA_ANCHORS,
  BRIDGES,
  ISLANDS,
  LAGOON,
  PONDS,
  RESPAWN_POINTS,
  respawnPosition,
  TRACK,
  WORLD_SIZE,
  type AreaKey,
  type Bounds,
  type Point,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { valueNoise } from './noise';

const CURVE_SAMPLES = 12;
export const trackLoop = closedCurve(TRACK.centerline, CURVE_SAMPLES);
const islandLoops = ISLANDS.map(({ outline }) => outline);

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export function boxDistance(point: Point, from: Point, to: Point): number {
  const halfX = Math.abs(to[0] - from[0]) / 2;
  const halfZ = Math.abs(to[1] - from[1]) / 2;
  const dx = Math.abs(point[0] - (from[0] + to[0]) / 2) - halfX;
  const dz = Math.abs(point[1] - (from[1] + to[1]) / 2) - halfZ;
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
}

const TRACK_BED = 6.5;
const ZONE_SHORE = 7.5;
const SHORE_BULGE = { cell: 14, reach: 4 } as const;
const WORLD_EDGE = 3;
const EDGE_BAYS = { cell: 11, reach: 4 } as const;
const BRIDGE_WATER = { abutment: 0.2, reach: 3 } as const;
const POND_SHORE = { lobes: 3, wobble: 0.15 } as const;

const along = (from: Point, to: Point, share: number): Point => [
  from[0] + (to[0] - from[0]) * share,
  from[1] + (to[1] - from[1]) * share,
];

const bridgeSpans = BRIDGES.map(({ from, to }): readonly [Point, Point] => [
  along(from, to, BRIDGE_WATER.abutment),
  along(from, to, 1 - BRIDGE_WATER.abutment),
]);

function bridgeWater(point: Point): number {
  return Math.min(...bridgeSpans.map(([from, to]) => segmentDistance(point, from, to) - BRIDGE_WATER.reach));
}

export function pondShore([x, z]: Point): number {
  return Math.min(
    ...PONDS.map(({ center, radius }) => {
      const angle = Math.atan2(z - center[1], x - center[0]);
      const shore = radius * (1 + POND_SHORE.wobble * Math.sin(POND_SHORE.lobes * angle + center[0]));
      return Math.hypot(x - center[0], z - center[1]) - shore;
    }),
  );
}

function lagoonShore([x, z]: Point): number {
  const { center, radii } = LAGOON;
  const reach = Math.hypot((x - center[0]) / radii[0], (z - center[1]) / radii[1]);
  return (reach - 1) * Math.min(radii[0], radii[1]);
}

export function landDistance(point: Point): number {
  const islands = islandLoops.map((loop) => signedLoopDistance(point, loop));
  const trackBed = TRACK.width / 2 + TRACK_BED - loopDistance(point, trackLoop);
  const zoneShore = Math.min(
    ZONE_SHORE + valueNoise(point, SHORE_BULGE.cell) * SHORE_BULGE.reach - padDistance(point),
    lagoonShore(point),
    WORLD_SIZE / 2 -
      WORLD_EDGE -
      valueNoise(point, EDGE_BAYS.cell) * EDGE_BAYS.reach -
      Math.max(Math.abs(point[0]), Math.abs(point[1])),
  );
  const land = Math.max(trackBed, zoneShore, ...islands);
  return Math.min(
    land,
    boxDistance(point, TRACK.waterJump.from, TRACK.waterJump.to),
    bridgeWater(point),
    pondShore(point),
  );
}

const openGrounds = Object.values(AREA_ANCHORS).flatMap(({ placed, bounds, runUp }) =>
  [bounds, ...(runUp ? [runUp] : [])].map((box) => zoneBox(placed, box)),
);

export function zoneBox(placed: Point, [west, north, east, south]: Bounds): readonly [from: Point, to: Point] {
  return [
    [placed[0] + west, placed[1] + north],
    [placed[0] + east, placed[1] + south],
  ];
}

export function padDistance(point: Point): number {
  return Math.min(...openGrounds.map(([from, to]) => boxDistance(point, from, to)));
}

const objectBoxes = Object.entries(AREA_ANCHORS).flatMap(([area, { placed, bounds, runUp }]) =>
  [...(AREA_FOOTPRINTS[area as AreaKey] ?? [bounds]), ...(runUp ? [runUp] : [])].map((box) => zoneBox(placed, box)),
);

export function objectDistance(point: Point): number {
  return Math.min(...objectBoxes.map(([from, to]) => boxDistance(point, from, to)));
}

export function trackClearance(point: Point): number {
  return loopDistance(point, trackLoop) - TRACK.width / 2;
}

const respawnPoints = Object.values(RESPAWN_POINTS).map(respawnPosition);

export function respawnDistance(point: Point): number {
  return Math.min(...respawnPoints.map(([x, z]) => Math.hypot(point[0] - x, point[1] - z)));
}

const bridgeEnds = BRIDGES.flatMap(({ from, to }) => [from, to]);

export function bridgeDistance(point: Point): number {
  return Math.min(...bridgeEnds.map(([x, z]) => Math.hypot(point[0] - x, point[1] - z)));
}
