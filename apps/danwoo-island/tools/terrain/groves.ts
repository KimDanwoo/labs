import {
  introRingCenter,
  type Point,
  WORLD_SIZE,
} from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { bridgeDistance, landDistance, objectDistance, padDistance, respawnDistance, trackClearance } from './fields';
import { random } from './random';

const SEED = 20261118;
const HALF_WORLD = WORLD_SIZE / 2;
const GROVE = { spacing: 11, jitter: 0.8, inland: 4, track: 5, pad: 4, respawn: 8, bridge: 8 } as const;
export const GROVE_RADIUS = 6;

const hasRoom = (point: Point): boolean =>
  landDistance(point) > GROVE.inland &&
  trackClearance(point) > GROVE.track &&
  padDistance(point) > GROVE.pad &&
  respawnDistance(point) > GROVE.respawn &&
  bridgeDistance(point) > GROVE.bridge;

function plantGroves(): Point[] {
  const next = random(SEED);
  const centers: Point[] = [];
  for (let z = -HALF_WORLD + GROVE.spacing / 2; z < HALF_WORLD; z += GROVE.spacing) {
    for (let x = -HALF_WORLD + GROVE.spacing / 2; x < HALF_WORLD; x += GROVE.spacing) {
      const center: Point = [
        x + (next() - 0.5) * GROVE.spacing * GROVE.jitter,
        z + (next() - 0.5) * GROVE.spacing * GROVE.jitter,
      ];
      if (hasRoom(center)) centers.push(center);
    }
  }
  return centers;
}

export const GROVES: readonly Point[] = plantGroves();

export function groveDistance(point: Point): number {
  return Math.min(...GROVES.map(([x, z]) => Math.hypot(point[0] - x, point[1] - z)));
}

const GLADE = { spacing: 5, apart: 11, inland: 2.5, track: 2.5, object: 3, respawn: 3 } as const;
export const GLADE_RADIUS = 2.5;

const canGrow = (point: Point): boolean =>
  landDistance(point) > GLADE.inland &&
  trackClearance(point) > GLADE.track &&
  objectDistance(point) > GLADE.object &&
  respawnDistance(point) > GLADE.respawn;

const isBare = (point: Point, greens: readonly Point[]): boolean =>
  greens.every(([x, z]) => Math.hypot(point[0] - x, point[1] - z) >= GLADE.apart);

function openGlades(): Point[] {
  const glades: Point[] = [introRingCenter()];
  for (let z = -HALF_WORLD + GLADE.spacing / 2; z < HALF_WORLD; z += GLADE.spacing) {
    for (let x = -HALF_WORLD + GLADE.spacing / 2; x < HALF_WORLD; x += GLADE.spacing) {
      const spot: Point = [x, z];
      const isOpenGlade = canGrow(spot) && isBare(spot, GROVES) && isBare(spot, glades);
      if (isOpenGlade) glades.push(spot);
    }
  }
  return glades;
}

export const GLADES: readonly Point[] = openGlades();

export function gladeDistance(point: Point): number {
  return Math.min(...GLADES.map(([x, z]) => Math.hypot(point[0] - x, point[1] - z)));
}
