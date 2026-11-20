import { type Point, AREA_ANCHORS, WORLD_SIZE } from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { bridgeDistance, landDistance, objectDistance, padDistance, respawnDistance, trackClearance } from './fields';
import { type Planting, type Room, BEACH_PALMS, CAMERA_SIDE, SHORE_ROCKS, TREE_COVER } from './scatterPlan';

const HALF_WORLD = WORLD_SIZE / 2;
export const BRIDGE_CLEARANCE = 6;
export const RESPAWN_CLEARANCE = 5;
export const PALM_COAST = 12;
export const CRATE_RING = 3;
const PAD_LIGHT_GAP = 2;
const ATTEMPTS_PER_PLANT = 4;
type Placement = readonly [x: number, z: number, rotation: number, scale: number];
type Next = () => number;
const round = (value: number): number => Math.round(value * 10) / 10;
export const onLand = (point: Point, inland: number): boolean => landDistance(point) > inland;
export const hasRoom = (point: Point, { isLow, inland, track, pad }: Room): boolean =>
  onLand(point, inland) &&
  trackClearance(point) > track &&
  (isLow ? objectDistance(point) : padDistance(point)) > pad &&
  bridgeDistance(point) > BRIDGE_CLEARANCE &&
  respawnDistance(point) > RESPAWN_CLEARANCE;
export const isApart = (point: Point, others: readonly Point[], gap: number): boolean =>
  others.every(([x, z]) => Math.hypot(point[0] - x, point[1] - z) >= gap);
const isOnStage = (point: Point): boolean =>
  padDistance(point) < TREE_COVER.pad || trackClearance(point) < 0 || respawnDistance(point) < TREE_COVER.respawn;
function hidesStage([x, z]: Point): boolean {
  const steps = Array.from({ length: TREE_COVER.reach / TREE_COVER.step }, (_, index) => (index + 1) * TREE_COVER.step);
  return steps.some((behind) => isOnStage([x - CAMERA_SIDE[0] * behind, z - CAMERA_SIDE[1] * behind]));
}
export const isTrackBelt = (point: Point, [from, to]: readonly [number, number]): boolean =>
  trackClearance(point) > from && trackClearance(point) < to;
function around(center: Point, [from, to]: Planting['reach'], next: Next): Point {
  const angle = next() * Math.PI * 2;
  const reach = from + Math.sqrt(next()) * (to - from);
  return [center[0] + Math.cos(angle) * reach, center[1] + Math.sin(angle) * reach];
}
export function plantCluster(center: Point, planting: Planting, next: Next, taken: Point[]): Point[] {
  const wanted = planting.count[0] + Math.floor(next() * (planting.count[1] - planting.count[0] + 1));
  const planted: Point[] = [];
  for (let attempt = 0; attempt < wanted * ATTEMPTS_PER_PLANT && planted.length < wanted; attempt += 1) {
    const point = around(center, planting.reach, next);
    if (!hasRoom(point, planting)) continue;
    if (!isApart(point, taken, planting.gap)) continue;
    const isBlockingStage = planting.isTall && hidesStage(point);
    if (isBlockingStage) continue;
    taken.push(point);
    planted.push(point);
  }
  return planted;
}
export function jitteredGrid(spacing: number, jitter: number, next: Next): Point[] {
  const points: Point[] = [];
  for (let z = -HALF_WORLD + spacing / 2; z < HALF_WORLD; z += spacing) {
    for (let x = -HALF_WORLD + spacing / 2; x < HALF_WORLD; x += spacing) {
      points.push([x + (next() - 0.5) * spacing * jitter, z + (next() - 0.5) * spacing * jitter]);
    }
  }
  return points;
}
export function padCorners(): Point[] {
  return Object.values(AREA_ANCHORS).flatMap(({ placed, bounds }) => [
    [placed[0] + bounds[0] - PAD_LIGHT_GAP, placed[1] + bounds[1] - PAD_LIGHT_GAP] satisfies Point,
    [placed[0] + bounds[2] + PAD_LIGHT_GAP, placed[1] + bounds[3] + PAD_LIGHT_GAP] satisfies Point,
  ]);
}
export function ringAround(center: Point, radius: number, count: number): Point[] {
  return Array.from({ length: count }, (_, index): Point => {
    const angle = (index / count) * Math.PI * 2;
    return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
  });
}
export const asPlacement = ([x, z]: Point): Placement => [round(x), round(z), 0, 1];
export const asPlant =
  (next: Next) =>
  ([x, z]: Point): Placement => [round(x), round(z), round(next() * Math.PI * 2), round(0.85 + next() * 0.35)];
export const isBeach = (point: Point): boolean =>
  !onLand(point, BEACH_PALMS.beach[1]) &&
  hasRoom(point, { inland: BEACH_PALMS.beach[0], track: BEACH_PALMS.track, pad: BEACH_PALMS.pad });
export const isShoreRock = (point: Point): boolean =>
  !onLand(point, SHORE_ROCKS.shore[1]) &&
  hasRoom(point, { inland: SHORE_ROCKS.shore[0], track: SHORE_ROCKS.track, pad: SHORE_ROCKS.pad });
