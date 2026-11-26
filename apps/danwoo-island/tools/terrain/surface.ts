import { readFileSync } from 'node:fs';
import path from 'node:path';
import { coveBed, islandRadius } from '../../src/views/drive/lib/engine/game/world/layout/tideCove';

import {
  WORLD_SIZE,
  introRingCenter,
  type Point,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { landDistance, objectDistance, smoothstep, trackClearance, trailDistance } from './fields';
import { GLADE_RADIUS, GROVE_RADIUS, gladeDistance, groveDistance } from './groves';
import { ragged, valueNoise } from './noise';

const BEACH = { inland: 1.5, offshore: -4 } as const;
const GRASS = { coast: 2, trackClearance: 3, padClearance: 2.5, edge: 1.5 } as const;
const GROVE_FLOOR = 3;
const GROVE_EDGE = { cell: 6, reach: 3 } as const;
const CLEARING_EDGE = { cell: 7, reach: 2.5 } as const;
const TUFTS = { cell: 9, from: 0.68, to: 0.74 } as const;
const GLADE_EDGE = { cell: 4, reach: 1.5 } as const;
const GLADE_FRINGE = 1.5;
const TRAIL = { clearance: 1.6, edge: 1.2 } as const;
const TRAIL_EDGE = { cell: 3, reach: 0.6 } as const;
const PAVED = { shoulder: 2.5, edge: 1.5 } as const;

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

function grassCover(point: Point, land: number): number {
  const coast = smoothstep(GRASS.coast, GRASS.coast + GRASS.edge, land);
  const groveEdge = groveDistance(point) + ragged(point, GROVE_EDGE);
  const grove = smoothstep(GROVE_RADIUS + GROVE_FLOOR, GROVE_RADIUS, groveEdge);
  const tufts = smoothstep(TUFTS.from, TUFTS.to, valueNoise(point, TUFTS.cell));
  const gladeEdge = gladeDistance(point) + ragged(point, GLADE_EDGE);
  const glade = smoothstep(GLADE_RADIUS + GLADE_FRINGE, GLADE_RADIUS, gladeEdge);
  return Math.max(sampleMask(GRASS_MASK, point), grove, glade, tufts) * coast;
}

const BEACH_CENTER = introRingCenter();

function landingGrass([x, z]: Point, surrounding: number): number {
  const u = x - BEACH_CENTER[0];
  const v = z - BEACH_CENTER[1];
  const influence = 1 - smoothstep(6, 10, Math.hypot(u, v));
  if (influence === 0) return surrounding;
  const drift = ragged([x, z], { cell: 1.1, reach: 0.26 });
  const canopy = Math.hypot((u + 3.7) / 3.4, (v + 0.4) / 5.1);
  const hollow = Math.hypot((u - 0.1) / 2.2, (v + 0.1) / 3.3);
  const crescent = smoothstep(1.08, 0.84, canopy + drift * 0.25) * smoothstep(0.95, 1.14, hollow);
  const lee = Math.hypot((u - 4.5) / 1.2, (v - 1.1) / 0.68);
  const fringe = smoothstep(1.12, 0.72, lee + drift) * 0.72;
  return surrounding + (Math.max(crescent, fringe) - surrounding) * influence;
}

export interface TerrainSample {
  readonly paved: number;
  readonly grass: number;
  readonly depth: number;
}

export function sampleTerrain(point: Point): TerrainSample {
  const land = landDistance(point);
  const track = trackClearance(point);
  const depth = smoothstep(BEACH.inland, BEACH.offshore, land);
  const paved = land > 0 ? smoothstep(PAVED.shoulder + PAVED.edge, PAVED.shoulder, track) : 0;
  const surrounding =
    grassCover(point, land) *
    smoothstep(TRAIL.clearance, TRAIL.clearance + TRAIL.edge, trailDistance(point) + ragged(point, TRAIL_EDGE)) *
    smoothstep(
      GRASS.padClearance,
      GRASS.padClearance + GRASS.edge,
      objectDistance(point) + ragged(point, CLEARING_EDGE),
    );
  const grass =
    landingGrass(point, surrounding) *
    smoothstep(0.5, 1.8, land) *
    smoothstep(GRASS.trackClearance, GRASS.trackClearance + GRASS.edge, track);
  const bed = coveBed(point[0], point[1], depth);
  const shoreGrass = bed > depth ? grass * (1 - smoothstep(0, 0.12, bed)) : grass;
  return { paved, grass: shoreGrass * smoothstep(1, 1.25, islandRadius(...point)), depth: bed };
}
