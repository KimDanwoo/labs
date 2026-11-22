import { writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  BRIDGES,
  introRingCenter,
  type Point,
  TRACK,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { landDistance, respawnDistance, trackClearance } from './fields';
import { GLADES, GROVES } from './groves';
import { random } from './random';
import {
  BEACH_PALM_PAIR,
  BEACH_PALMS,
  BELT_BUSH,
  BELT_TREE,
  BLOSSOMS,
  SHORE_ROCKS,
  START_GARDEN,
  THICKET,
  THICKET_BUSHES,
  THICKET_FLOWERS,
  TRACK_HEDGE,
  TRACK_TREES,
  TREES,
  UNDERGROWTH,
} from './scatterPlan';
import {
  asPlacement,
  asPlant,
  bridgeLanternSpots,
  CRATE_RING,
  hasRoom,
  isApart,
  isBeach,
  isShoreRock,
  isTrackBelt,
  jitteredGrid,
  onLand,
  padCorners,
  PALM_COAST,
  plantCluster,
  RESPAWN_CLEARANCE,
  ringAround,
} from './scatterRules';
import { sampleTerrain } from './surface';

const OUTPUT = path.resolve(import.meta.dirname, '../../src/views/drive/lib/engine/game/world/layout/islandScatter.ts');
const SEED = 20261117;

const GRASSY = 0.5;
const isOnGrass = (point: Point): boolean => sampleTerrain(point).grass > GRASSY;
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
    flowers: [...flowers, ...inStartGarden('flowers')].filter(isOnGrass).map(plant),
    lights: padCorners()
      .filter((point) => hasRoom(point, { inland: 1, track: 3, pad: -0.5 }))
      .map(asPlacement),
    lanterns: BRIDGES.flatMap(bridgeLanternSpots)
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
