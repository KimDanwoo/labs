import { RIVER_TRENCH_HALF_WIDTH } from '@views/ride/config/scene';
import { coastDistanceAt, distanceToRiver } from '@views/ride/lib/scene/terrain';
import { isExplorationClearing } from '@views/ride/model/exploration/world';

export const FLORA = {
  cell: 32,
  viewRadius: { desktop: 12, mobile: 5 },
  riverMargin: 10,
  spawnClearRadius: 30,
  trunk: { radiusTop: 0.14, radiusBottom: 0.36, height: 4.1, segments: 9 },
  canopy: { radius: 2.2, detail: 3, blobs: 15, leaves: { mobile: 100, desktop: 180 }, farBlobs: 6 },
  branches: 5,
  conifer: { radius: 2.1, tierHeight: 1.8, tiers: 6, segments: 13 },
  rock: { radius: 0.9, detail: 0 },
  sway: 0.07,
  shadeBottom: 0.72,
  shadeTop: 1.1,
  runnerRadius: 0.8,
  maxTrees: 600,
  maxRocks: 400,
  colors: {
    trunk: '#66513b',
    canopy: ['#45654e', '#63825a', '#365643', '#809064'],
    conifer: ['#48654b', '#5d7953'],
    rock: '#8d8779',
  },
} as const;

export type FloraKind = 'tree' | 'conifer' | 'rock';

export type FloraPlacement = {
  kind: FloraKind;
  x: number;
  z: number;
  yaw: number;
  scale: number;
  variant: number;
};

function hash2(cellX: number, cellZ: number, salt: number): number {
  let h = (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663) ^ Math.imul(salt, 83492791)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function isBlocked(x: number, z: number): boolean {
  if (isExplorationClearing(x, z)) return true;
  if (coastDistanceAt(x, z) > -32) return true;
  if (distanceToRiver(x, z) < RIVER_TRENCH_HALF_WIDTH + FLORA.riverMargin) return true;
  return Math.hypot(x, z) < FLORA.spawnClearRadius;
}

const cellCache = new Map<string, FloraPlacement[]>();
const MAX_CACHED_CELLS = 2048;

export function floraInCell(cellX: number, cellZ: number): FloraPlacement[] {
  const key = `${cellX}:${cellZ}`;
  const cached = cellCache.get(key);
  if (cached) return cached;
  const out: FloraPlacement[] = [];
  const origin = { x: cellX * FLORA.cell, z: cellZ * FLORA.cell };
  const grove = hash2(cellX, cellZ, 1);
  const treeCount = grove < 0.5 ? 0 : 1 + Math.floor((grove - 0.5) * 8);
  const kind: FloraKind = hash2(cellX, cellZ, 3) < 0.65 ? 'tree' : 'conifer';
  for (let i = 0; i < treeCount; i += 1) {
    const x = origin.x + (hash2(cellX, cellZ, 10 + i * 3) - 0.5) * FLORA.cell;
    const z = origin.z + (hash2(cellX, cellZ, 11 + i * 3) - 0.5) * FLORA.cell;
    if (isBlocked(x, z)) continue;
    const r = hash2(cellX, cellZ, 12 + i * 3);
    out.push({ kind, x, z, yaw: r * Math.PI * 2, scale: 0.8 + r * 0.8, variant: Math.floor(r * 97) % 4 });
  }
  const rockCount = Math.floor(hash2(cellX, cellZ, 2) * 3);
  for (let i = 0; i < rockCount; i += 1) {
    const x = origin.x + (hash2(cellX, cellZ, 40 + i * 3) - 0.5) * FLORA.cell;
    const z = origin.z + (hash2(cellX, cellZ, 41 + i * 3) - 0.5) * FLORA.cell;
    if (isBlocked(x, z)) continue;
    const r = hash2(cellX, cellZ, 42 + i * 3);
    out.push({ kind: 'rock', x, z, yaw: r * Math.PI * 2, scale: 0.5 + r * 1.2, variant: 0 });
  }
  if (cellCache.size >= MAX_CACHED_CELLS) cellCache.delete(cellCache.keys().next().value!);
  cellCache.set(key, out);
  return out;
}

export function floraCellOf(v: number): number {
  return Math.round(v / FLORA.cell);
}

function pushOutOfItem(position: { x: number; z: number }, item: FloraPlacement): number {
  const solid = item.kind === 'rock' ? FLORA.rock.radius * item.scale : FLORA.trunk.radiusBottom * item.scale;
  const minDist = solid + FLORA.runnerRadius;
  const ox = position.x - item.x;
  const oz = position.z - item.z;
  const dist = Math.hypot(ox, oz);
  if (dist >= minDist) return 0;
  if (dist === 0) return 0;
  const k = (minDist - dist) / dist;
  position.x += ox * k;
  position.z += oz * k;
  return minDist - dist;
}

export function pushOutOfFlora(position: { x: number; z: number }): number {
  const cx = floraCellOf(position.x);
  const cz = floraCellOf(position.z);
  let pushed = 0;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      for (const item of floraInCell(cx + dx, cz + dz)) pushed += pushOutOfItem(position, item);
    }
  }
  return pushed;
}
