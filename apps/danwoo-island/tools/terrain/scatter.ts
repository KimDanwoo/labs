import { writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  AREA_ANCHORS,
  BRIDGES,
  introRingCenter,
  type Point,
  TRACK,
  WORLD_SIZE,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { bridgeDistance, landDistance, objectDistance, padDistance, respawnDistance, trackClearance } from './fields';
import { GLADES, GROVE_RADIUS, GROVES } from './groves';
import { random } from './random';

const OUTPUT = path.resolve(import.meta.dirname, '../../src/views/drive/lib/engine/game/world/layout/islandScatter.ts');
const HALF_WORLD = WORLD_SIZE / 2;
const SEED = 20261117;
const BRIDGE_CLEARANCE = 6;
const RESPAWN_CLEARANCE = 5;
const PALM_COAST = 12;
const CRATE_RING = 3;
const PAD_LIGHT_GAP = 2;
const ATTEMPTS_PER_PLANT = 4;

interface Room {
  readonly isLow?: boolean;
  readonly inland: number;
  readonly track: number;
  readonly pad: number;
}

interface Planting extends Room {
  readonly isTall?: boolean;
  readonly count: readonly [min: number, max: number];
  readonly reach: readonly [from: number, to: number];
  readonly gap: number;
}

const TREES: Planting = {
  isTall: true,
  count: [5, 9],
  reach: [0, GROVE_RADIUS],
  gap: 2.8,
  inland: 3,
  track: 4,
  pad: 3,
};
const UNDERGROWTH: Planting = {
  isLow: true,
  count: [4, 7],
  reach: [3, GROVE_RADIUS + 3],
  gap: 2,
  inland: 2,
  track: 3,
  pad: 3.5,
};
const BLOSSOMS: Planting = {
  isLow: true,
  count: [4, 8],
  reach: [0, GROVE_RADIUS + 4],
  gap: 1.5,
  inland: 2,
  track: 3,
  pad: 2,
};
const THICKET = { isLow: true, spacing: 13, jitter: 0.8, inland: 3, track: 3, pad: 2.5 } as const;
const THICKET_BUSHES: Planting = {
  isLow: true,
  count: [2, 5],
  reach: [0, 3.5],
  gap: 1.8,
  inland: 2,
  track: 3,
  pad: 3.5,
};
const THICKET_FLOWERS: Planting = {
  isLow: true,
  count: [2, 5],
  reach: [0, 4.5],
  gap: 1.2,
  inland: 2,
  track: 3,
  pad: 2,
};
const BEACH_PALMS = { spacing: 10, jitter: 0.8, beach: [2, 6], track: 4, pad: 3 } as const;
const BEACH_PALM_PAIR: Planting = {
  isTall: true,
  count: [1, 3],
  reach: [0, 2.6],
  gap: 2.2,
  inland: 2,
  track: 4,
  pad: 3,
};
const TRACK_TREES = { spacing: 6, jitter: 0.7, belt: [5, 8] } as const;
const TRACK_HEDGE = { spacing: 4, jitter: 0.8, belt: [3.2, 5.5] } as const;
const SINGLE: Planting['count'] = [1, 1];
const BELT_TREE: Planting = { isTall: true, count: SINGLE, reach: [0, 0], gap: 3.4, inland: 3, track: 4, pad: 3 };
const BELT_BUSH: Planting = { count: SINGLE, reach: [0, 0], gap: 2.2, inland: 2, track: 3, pad: 1.5 };
const START_GARDEN = {
  palms: [[-3.2, -0.6]],
  rocks: [[3.2, 0.5]],
  bushes: [
    [-2.6, -1.6],
    [-3, 1.7],
  ],
  flowers: [
    [-1.8, 0.6],
    [-2.9, 0.9],
    [1.3, 1.9],
    [3, -1.4],
    [-0.8, -2.8],
    [0.5, 3],
  ],
} as const satisfies Record<string, readonly Point[]>;
const CAMERA_SIDE: Point = [Math.SQRT1_2, Math.SQRT1_2];
const TREE_COVER = { reach: 12, step: 2, pad: 3, respawn: 5 } as const;
const SHORE_ROCKS = { spacing: 11, jitter: 0.8, shore: [-1, 2.5], track: 5, pad: 3 } as const;

type Placement = readonly [x: number, z: number, rotation: number, scale: number];
type Next = () => number;

const round = (value: number): number => Math.round(value * 10) / 10;
const onLand = (point: Point, inland: number): boolean => landDistance(point) > inland;

const hasRoom = (point: Point, { isLow, inland, track, pad }: Room): boolean =>
  onLand(point, inland) &&
  trackClearance(point) > track &&
  (isLow ? objectDistance(point) : padDistance(point)) > pad &&
  bridgeDistance(point) > BRIDGE_CLEARANCE &&
  respawnDistance(point) > RESPAWN_CLEARANCE;

const isApart = (point: Point, others: readonly Point[], gap: number): boolean =>
  others.every(([x, z]) => Math.hypot(point[0] - x, point[1] - z) >= gap);

const isOnStage = (point: Point): boolean =>
  padDistance(point) < TREE_COVER.pad || trackClearance(point) < 0 || respawnDistance(point) < TREE_COVER.respawn;

function hidesStage([x, z]: Point): boolean {
  const steps = Array.from({ length: TREE_COVER.reach / TREE_COVER.step }, (_, index) => (index + 1) * TREE_COVER.step);
  return steps.some((behind) => isOnStage([x - CAMERA_SIDE[0] * behind, z - CAMERA_SIDE[1] * behind]));
}

const isTrackBelt = (point: Point, [from, to]: readonly [number, number]): boolean =>
  trackClearance(point) > from && trackClearance(point) < to;

function around(center: Point, [from, to]: Planting['reach'], next: Next): Point {
  const angle = next() * Math.PI * 2;
  const reach = from + Math.sqrt(next()) * (to - from);
  return [center[0] + Math.cos(angle) * reach, center[1] + Math.sin(angle) * reach];
}

function plantCluster(center: Point, planting: Planting, next: Next, taken: Point[]): Point[] {
  const wanted = planting.count[0] + Math.floor(next() * (planting.count[1] - planting.count[0] + 1));
  const planted: Point[] = [];
  for (let attempt = 0; attempt < wanted * ATTEMPTS_PER_PLANT && planted.length < wanted; attempt += 1) {
    const point = around(center, planting.reach, next);
    if (!hasRoom(point, planting) || !isApart(point, taken, planting.gap)) continue;
    if (planting.isTall && hidesStage(point)) continue;
    taken.push(point);
    planted.push(point);
  }
  return planted;
}

function jitteredGrid(spacing: number, jitter: number, next: Next): Point[] {
  const points: Point[] = [];
  for (let z = -HALF_WORLD + spacing / 2; z < HALF_WORLD; z += spacing) {
    for (let x = -HALF_WORLD + spacing / 2; x < HALF_WORLD; x += spacing) {
      points.push([x + (next() - 0.5) * spacing * jitter, z + (next() - 0.5) * spacing * jitter]);
    }
  }
  return points;
}

function padCorners(): Point[] {
  return Object.values(AREA_ANCHORS).flatMap(({ placed, bounds }) => [
    [placed[0] + bounds[0] - PAD_LIGHT_GAP, placed[1] + bounds[1] - PAD_LIGHT_GAP] satisfies Point,
    [placed[0] + bounds[2] + PAD_LIGHT_GAP, placed[1] + bounds[3] + PAD_LIGHT_GAP] satisfies Point,
  ]);
}

function ringAround(center: Point, radius: number, count: number): Point[] {
  return Array.from({ length: count }, (_, index): Point => {
    const angle = (index / count) * Math.PI * 2;
    return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
  });
}

const asPlacement = ([x, z]: Point): Placement => [round(x), round(z), 0, 1];
const asPlant =
  (next: Next) =>
  ([x, z]: Point): Placement => [round(x), round(z), round(next() * Math.PI * 2), round(0.85 + next() * 0.35)];

const isBeach = (point: Point): boolean =>
  !onLand(point, BEACH_PALMS.beach[1]) &&
  hasRoom(point, { inland: BEACH_PALMS.beach[0], track: BEACH_PALMS.track, pad: BEACH_PALMS.pad });

const isShoreRock = (point: Point): boolean =>
  !onLand(point, SHORE_ROCKS.shore[1]) &&
  hasRoom(point, { inland: SHORE_ROCKS.shore[0], track: SHORE_ROCKS.track, pad: SHORE_ROCKS.pad });

export function writeScatter(): void {
  const next = random(SEED);
  const solid: Point[] = [];
  const soft: Point[] = [];
  const groveTrees = GROVES.flatMap((grove) => plantCluster(grove, TREES, next, solid));
  const beachPalms = jitteredGrid(BEACH_PALMS.spacing, BEACH_PALMS.jitter, next)
    .filter(isBeach)
    .flatMap((spot) => plantCluster(spot, BEACH_PALM_PAIR, next, solid));
  const trackTrees = jitteredGrid(TRACK_TREES.spacing, TRACK_TREES.jitter, next)
    .filter((point) => isTrackBelt(point, TRACK_TREES.belt))
    .flatMap((spot) => plantCluster(spot, BELT_TREE, next, solid));
  const trees = [...groveTrees, ...beachPalms, ...trackTrees];
  const hedge = jitteredGrid(TRACK_HEDGE.spacing, TRACK_HEDGE.jitter, next)
    .filter((point) => isTrackBelt(point, TRACK_HEDGE.belt))
    .flatMap((spot) => plantCluster(spot, BELT_BUSH, next, soft));
  const thickets = [
    ...jitteredGrid(THICKET.spacing, THICKET.jitter, next).filter((point) => hasRoom(point, THICKET)),
    ...GLADES,
  ];
  const bushes = [
    ...GROVES.flatMap((grove) => plantCluster(grove, UNDERGROWTH, next, soft)),
    ...thickets.flatMap((thicket) => plantCluster(thicket, THICKET_BUSHES, next, soft)),
    ...hedge,
  ];
  const flowers = [
    ...GROVES.flatMap((grove) => plantCluster(grove, BLOSSOMS, next, soft)),
    ...thickets.flatMap((thicket) => plantCluster(thicket, THICKET_FLOWERS, next, soft)),
  ];
  const rocks = jitteredGrid(SHORE_ROCKS.spacing, SHORE_ROCKS.jitter, next).filter(
    (point) => isShoreRock(point) && isApart(point, solid, TREES.gap),
  );
  const [ringX, ringZ] = introRingCenter();
  const inStartGarden = (kind: keyof typeof START_GARDEN): Point[] =>
    START_GARDEN[kind].map(([x, z]): Point => [ringX + x, ringZ + z]);
  const plant = asPlant(next);
  const scatterSet = {
    palms: [...trees.filter((point) => landDistance(point) < PALM_COAST), ...inStartGarden('palms')].map(plant),
    jungle: trees.filter((point) => landDistance(point) >= PALM_COAST).map(plant),
    rocks: [...rocks, ...inStartGarden('rocks')].map(plant),
    bushes: [...bushes, ...inStartGarden('bushes')].map(plant),
    flowers: [...flowers, ...inStartGarden('flowers')].map(plant),
    lights: padCorners()
      .filter((point) => hasRoom(point, { inland: 1, track: 3, pad: -0.5 }))
      .map(asPlacement),
    lanterns: BRIDGES.flatMap(({ from, to }) => [from, to])
      .flatMap((end) => ringAround(end, BRIDGE_CLEARANCE - 2, 2))
      .filter((point) => onLand(point, 0.5) && trackClearance(point) > 3 && respawnDistance(point) > RESPAWN_CLEARANCE)
      .map(asPlacement),
    crates: TRACK.kickers
      .flatMap((point) => ringAround(point, TRACK.width / 2 + CRATE_RING + 3, 3))
      .filter((point) => onLand(point, 1) && trackClearance(point) > CRATE_RING)
      .map(asPlacement),
  };
  const body = Object.entries(scatterSet)
    .map(([name, list]) => `  ${name}: [\n${list.map((item) => `    [${item.join(', ')}],`).join('\n')}\n  ],`)
    .join('\n');
  writeFileSync(
    OUTPUT,
    `export type ScatterPlacement = readonly [x: number, z: number, rotation: number, scale: number];\n\nexport const ISLAND_SCATTER = {\n${body}\n} as const satisfies Record<string, readonly ScatterPlacement[]>;\n`,
  );
  const summary = Object.entries(scatterSet)
    .map(([name, list]) => `${name} ${list.length}`)
    .join(', ');
  process.stdout.write(`소품 자리를 정했어요: ${summary}\n`);
}
