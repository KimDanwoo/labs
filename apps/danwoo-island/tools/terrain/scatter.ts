import { writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  AREA_ANCHORS,
  BRIDGES,
  type Point,
  TRACK,
  WORLD_SIZE,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { landDistance, padDistance, sampleTerrain, trackClearance } from './fields';

const OUTPUT = path.resolve(import.meta.dirname, '../../src/views/drive/lib/engine/game/world/layout/islandScatter.ts');
const HALF_WORLD = WORLD_SIZE / 2;
const BRIDGE_CLEARANCE = 6;
const SEED = 20261117;
const PALM_COAST = 12;
const CRATE_RING = 3;
const PAD_LIGHT_GAP = 2;

interface Rule {
  readonly spacing: number;
  readonly accept: (point: Point) => boolean;
  readonly limit: number;
}

type Placement = readonly [x: number, z: number, rotation: number, scale: number];

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0;
    state ^= state >>> 13;
    return (state >>> 0) / 2 ** 32;
  };
}

const bridgeDistance = (point: Point): number =>
  Math.min(...BRIDGES.flatMap(({ from, to }) => [from, to]).map(([x, z]) => Math.hypot(point[0] - x, point[1] - z)));

const isClear = (point: Point, track: number, pad: number): boolean =>
  trackClearance(point) > track && padDistance(point) > pad && bridgeDistance(point) > BRIDGE_CLEARANCE;

const round = (value: number): number => Math.round(value * 10) / 10;

function scatter(rule: Rule, next: () => number, taken: Point[]): Placement[] {
  const placed: Placement[] = [];
  const cell = rule.spacing;
  for (let z = -HALF_WORLD + cell / 2; z < HALF_WORLD; z += cell) {
    for (let x = -HALF_WORLD + cell / 2; x < HALF_WORLD; x += cell) {
      if (placed.length >= rule.limit) return placed;
      const point: Point = [x + (next() - 0.5) * cell * 0.8, z + (next() - 0.5) * cell * 0.8];
      const tooClose = taken.some(([tx, tz]) => Math.hypot(tx - point[0], tz - point[1]) < cell * 0.7);
      if (tooClose || !rule.accept(point)) continue;
      taken.push(point);
      placed.push([round(point[0]), round(point[1]), round(next() * Math.PI * 2), round(0.85 + next() * 0.35)]);
    }
  }
  return placed;
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

const onLand = (point: Point, inland: number): boolean => landDistance(point) > inland;
const isGrassy = (point: Point): boolean => sampleTerrain(point).grass > 0.5;
const asPlacement = ([x, z]: Point): Placement => [round(x), round(z), 0, 1];

export function writeScatter(): void {
  const next = random(SEED);
  const taken: Point[] = [];
  const trees = scatter(
    { spacing: 7, limit: 220, accept: (point) => isGrassy(point) && onLand(point, 4) && isClear(point, 6, 3) },
    next,
    taken,
  );
  const palms = trees.filter(([x, z]) => landDistance([x, z]) < PALM_COAST);
  const jungle = trees.filter(([x, z]) => landDistance([x, z]) >= PALM_COAST);
  const flowers = scatter(
    { spacing: 8, limit: 70, accept: (point) => isGrassy(point) && onLand(point, 3) && isClear(point, 3, 1) },
    next,
    taken,
  );
  const rocks = scatter(
    { spacing: 13, limit: 40, accept: (point) => onLand(point, -1) && !onLand(point, 2.5) && isClear(point, 5, 3) },
    next,
    taken,
  );
  const bushes = scatter(
    { spacing: 6, limit: 130, accept: (point) => onLand(point, 2) && isClear(point, 4, 2) },
    next,
    taken,
  );
  const lights = padCorners()
    .filter((point) => onLand(point, 1) && isClear(point, 3, -0.5))
    .map(asPlacement);
  const lanterns = BRIDGES.flatMap(({ from, to }) => [from, to])
    .flatMap(([x, z]) => ringAround([x, z], BRIDGE_CLEARANCE - 2, 2))
    .filter((point) => onLand(point, 0.5) && trackClearance(point) > 3)
    .map(asPlacement);
  const crates = TRACK.kickers
    .flatMap((point) => ringAround(point, TRACK.width / 2 + CRATE_RING + 3, 3))
    .filter((point) => onLand(point, 1) && trackClearance(point) > CRATE_RING)
    .map(asPlacement);
  const scatterSet = { palms, jungle, rocks, bushes, flowers, lights, lanterns, crates };
  const body = Object.entries(scatterSet)
    .map(([name, list]) => `  ${name}: [\n${list.map((item) => `    [${item.join(', ')}],`).join('\n')}\n  ],`)
    .join('\n');
  writeFileSync(
    OUTPUT,
    `export type ScatterPlacement = readonly [x: number, z: number, rotation: number, scale: number];\n\nexport const ISLAND_SCATTER = {\n${body}\n} as const satisfies Record<string, readonly ScatterPlacement[]>;\n`,
  );
  process.stdout.write(
    `소품 자리를 정했어요: ${Object.entries(scatterSet)
      .map(([name, list]) => `${name} ${list.length}`)
      .join(', ')}\n`,
  );
}
