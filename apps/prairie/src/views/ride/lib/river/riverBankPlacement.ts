import type { Color, InstancedMesh, Object3D } from 'three';
import { RIVER } from '../../config/scene';
import { coastDistanceAt, groundHeightAt, nearestRiverX, riverWidthAt } from '../scene/terrain';
import { CELL, hash } from './riverBanks';

const RADIUS_COARSE = 3;
const RADIUS_FINE = 5;
const PER_SIDE = 4;
const SIDES = [-1, 1] as const;
const COAST_LIMIT = -26;

export interface BankMeshes {
  rocks: InstancedMesh;
  reeds: InstancedMesh;
}

export function bankKey(camera: { x: number; z: number }, coarse: boolean): string {
  const center = Math.round(camera.z / CELL);
  const river = Math.round((nearestRiverX(camera.x, camera.z) - RIVER.firstX) / RIVER.period);
  return `${center}:${river}:${coarse}`;
}

interface Site {
  x: number;
  z: number;
  seed: number;
  side: number;
  ground: number;
}

function placeRock(meshes: BankMeshes, dummy: Object3D, tint: Color, site: Site, index: number): void {
  const { x, z, seed, ground } = site;
  const size = 0.18 + hash(seed + 2) ** 3 * 0.65;
  dummy.position.set(x, ground + size * 0.12, z);
  dummy.rotation.set(hash(seed + 3) * 0.4, hash(seed + 4) * Math.PI, 0.2);
  dummy.scale.set(size * 1.5, size * 0.65, size);
  dummy.updateMatrix();
  meshes.rocks.setMatrixAt(index, dummy.matrix);
  tint.set('#9c9b85').multiplyScalar(0.8 + hash(seed + 5) * 0.35);
  meshes.rocks.setColorAt(index, tint);
}

function placeReed(meshes: BankMeshes, dummy: Object3D, tint: Color, site: Site, index: number): void {
  const { x, z, seed, side, ground } = site;
  dummy.position.set(x + side * 0.65, ground + 0.02, z + 0.5);
  dummy.rotation.set(0, seed, 0);
  dummy.scale.setScalar(1.2 + hash(seed + 6) * 1.5);
  dummy.updateMatrix();
  meshes.reeds.setMatrixAt(index, dummy.matrix);
  tint.set(hash(seed + 7) > 0.6 ? '#8a9360' : '#526e49');
  meshes.reeds.setColorAt(index, tint);
}

function siteAt(center: number, river: number, dz: number, side: number, i: number): Site | null {
  const seed = (center + dz) * 91.7 + river * 317 + side * 17 + i * 7.3;
  const z = (center + dz) * CELL + (hash(seed) - 0.5) * CELL;
  const bank = RIVER.halfWidth + 1.2 + hash(seed + 1) * 4.2;
  const x = nearestRiverX(RIVER.firstX + river * RIVER.period, z) + side * bank * riverWidthAt(z);
  if (coastDistanceAt(x, z) > COAST_LIMIT) return null;
  return { x, z, seed, side, ground: groundHeightAt(x, z) };
}

function sitesInRow(center: number, river: number, dz: number): Site[] {
  const sites: Site[] = [];
  for (const side of SIDES) {
    for (let i = 0; i < PER_SIDE; i++) {
      const site = siteAt(center, river, dz, side, i);
      if (site) sites.push(site);
    }
  }
  return sites;
}

export function rebuildBanks(
  meshes: BankMeshes,
  dummy: Object3D,
  tint: Color,
  camera: { x: number; z: number },
  coarse: boolean,
): void {
  const center = Math.round(camera.z / CELL);
  const river = Math.round((nearestRiverX(camera.x, camera.z) - RIVER.firstX) / RIVER.period);
  const radius = coarse ? RADIUS_COARSE : RADIUS_FINE;
  let count = 0;
  for (let dz = -radius; dz <= radius; dz++) {
    for (const site of sitesInRow(center, river, dz)) {
      placeRock(meshes, dummy, tint, site, count);
      placeReed(meshes, dummy, tint, site, count);
      count++;
    }
  }
  for (const mesh of [meshes.rocks, meshes.reeds]) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
}
