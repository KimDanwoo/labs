import { readFileSync } from 'node:fs';
import path from 'node:path';

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
  RESPAWN_POINTS,
  respawnPosition,
  TRACK,
  WORLD_SIZE,
  type Bounds,
  type Point,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';

const CURVE_SAMPLES = 12;
const BEACH = { inland: 1.5, offshore: -4 } as const;
const GRASS = { coast: 2, trackClearance: 3, padClearance: 0, edge: 1.5 } as const;
const PAVED = { shoulder: 2.5, edge: 1.5 } as const;

export const trackLoop = closedCurve(TRACK.centerline, CURVE_SAMPLES);
const islandLoops = ISLANDS.map(({ outline }) => outline);

interface Grayscale {
  readonly size: number;
  readonly values: Uint8Array;
}

function readGrayscale(file: string): Grayscale {
  const bytes = readFileSync(file);
  const header = bytes.subarray(0, 32).toString('ascii').split(/\s+/);
  const size = Number(header[1]);
  const offset = bytes.length - size * size;
  return { size, values: new Uint8Array(bytes.subarray(offset)) };
}

const GRASS_MASK = readGrayscale(path.resolve(import.meta.dirname, 'grassMask.pgm'));

function sampleMask({ size, values }: Grayscale, [x, z]: Point): number {
  const u = Math.min(size - 1, Math.max(0, (x / WORLD_SIZE + 0.5) * size - 0.5));
  const v = Math.min(size - 1, Math.max(0, (z / WORLD_SIZE + 0.5) * size - 0.5));
  const x0 = Math.floor(u);
  const z0 = Math.floor(v);
  const x1 = Math.min(size - 1, x0 + 1);
  const z1 = Math.min(size - 1, z0 + 1);
  const at = (column: number, row: number): number => (values[row * size + column] ?? 0) / 255;
  const top = at(x0, z0) + (at(x1, z0) - at(x0, z0)) * (u - x0);
  const bottom = at(x0, z1) + (at(x1, z1) - at(x0, z1)) * (u - x0);
  return top + (bottom - top) * (v - z0);
}

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
const SHORE_WAVE = { height: 2.5, lengths: [17, 23, 31] } as const;
const WORLD_EDGE = 3;
const BRIDGE_WATER = { abutment: 0.2, reach: 3 } as const;

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

function shoreWave([x, z]: Point): number {
  const [a, b, c] = SHORE_WAVE.lengths;
  const wave =
    Math.sin((x * Math.PI * 2) / a) + Math.sin((z * Math.PI * 2) / b) + Math.sin(((x + z) * Math.PI * 2) / c);
  return (SHORE_WAVE.height * (wave + 3)) / 6;
}

export function landDistance(point: Point): number {
  const islands = islandLoops.map((loop) => signedLoopDistance(point, loop));
  const trackBed = TRACK.width / 2 + TRACK_BED - loopDistance(point, trackLoop);
  const zoneShore = Math.min(
    ZONE_SHORE + shoreWave(point) - padDistance(point),
    WORLD_SIZE / 2 - WORLD_EDGE - Math.max(Math.abs(point[0]), Math.abs(point[1])),
  );
  const land = Math.max(trackBed, zoneShore, ...islands);
  return Math.min(land, boxDistance(point, TRACK.waterJump.from, TRACK.waterJump.to), bridgeWater(point));
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

export interface TerrainSample {
  readonly paved: number;
  readonly grass: number;
  readonly depth: number;
}

export function sampleTerrain(point: Point): TerrainSample {
  const land = landDistance(point);
  const track = loopDistance(point, trackLoop) - TRACK.width / 2;
  const depth = smoothstep(BEACH.inland, BEACH.offshore, land);
  const paved = land > 0 ? smoothstep(PAVED.shoulder + PAVED.edge, PAVED.shoulder, track) : 0;
  const grass =
    sampleMask(GRASS_MASK, point) *
    smoothstep(GRASS.coast, GRASS.coast + GRASS.edge, land) *
    smoothstep(GRASS.trackClearance, GRASS.trackClearance + GRASS.edge, track) *
    smoothstep(GRASS.padClearance, GRASS.padClearance + GRASS.edge, padDistance(point));
  return { paved, grass, depth };
}

export function trackClearance(point: Point): number {
  return loopDistance(point, trackLoop) - TRACK.width / 2;
}

const respawnPoints = Object.values(RESPAWN_POINTS).map(respawnPosition);

export function respawnDistance(point: Point): number {
  return Math.min(...respawnPoints.map(([x, z]) => Math.hypot(point[0] - x, point[1] - z)));
}
