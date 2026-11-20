import { MEADOW_PATH, RIVER_TRENCH_HALF_WIDTH } from '@views/ride/config/scene';
import { COLORS, hash, TILE } from '@views/ride/lib/flora/meadowFlowers';
import { coastDistanceAt, distanceToRiver, meadowPathDistanceAt, terrainHeightAt } from '@views/ride/lib/scene/terrain';
import type { InstancedMesh, Object3D } from 'three';

const PATCH_SPREAD = 4.5;
const COAST_LIMIT = -32;
const PATH_MARGIN = 0.6;
const RIVER_MARGIN = 5;

export interface FlowerMeshes {
  stems: InstancedMesh;
  flowers: InstancedMesh;
}

export function liftToBase(geometry: { translate: (x: number, y: number, z: number) => unknown }): void {
  geometry.translate(0, 0.5, 0);
}

export function isFlowerSpotBlocked(x: number, z: number): boolean {
  return (
    coastDistanceAt(x, z) > COAST_LIMIT ||
    meadowPathDistanceAt(x, z) < MEADOW_PATH.halfWidth + PATH_MARGIN ||
    distanceToRiver(x, z) < RIVER_TRENCH_HALF_WIDTH + RIVER_MARGIN
  );
}

interface FlowerSpot {
  x: number;
  z: number;
  angle: number;
  seed: number;
  index: number;
}

function placeFlower(meshes: FlowerMeshes, dummy: Object3D, spot: FlowerSpot, count: number): void {
  const { x, z, angle, seed, index } = spot;
  const height = 0.22 + hash(seed + index * 1.1) * 0.34;
  dummy.position.set(x, terrainHeightAt(x, z), z);
  dummy.rotation.set(0, angle, 0);
  dummy.scale.set(1, height, 1);
  dummy.updateMatrix();
  meshes.stems.setMatrixAt(count, dummy.matrix);
  dummy.position.y += height;
  dummy.rotation.set(0.12, angle, 0.16);
  dummy.scale.setScalar(0.5 + hash(seed + index * 5.3) * 0.5);
  dummy.updateMatrix();
  meshes.flowers.setMatrixAt(count, dummy.matrix);
  meshes.flowers.setColorAt(count, COLORS[Math.floor(hash(seed + index * 6.1) * COLORS.length)]!);
}

function placePatch(
  meshes: FlowerMeshes,
  dummy: Object3D,
  cell: { x: number; z: number },
  perCell: number,
  start: number,
): number {
  const seed = cell.x * 73.13 + cell.z * 37.71;
  const patchX = (cell.x + hash(seed)) * TILE;
  const patchZ = (cell.z + hash(seed + 3)) * TILE;
  let count = start;
  for (let i = 0; i < perCell; i += 1) {
    const angle = hash(seed + i * 2.7) * Math.PI * 2;
    const spread = Math.sqrt(hash(seed + i * 4.1 + 9)) * PATCH_SPREAD;
    const x = patchX + Math.cos(angle) * spread,
      z = patchZ + Math.sin(angle) * spread;
    if (isFlowerSpotBlocked(x, z)) continue;
    placeFlower(meshes, dummy, { x, z, angle, seed, index: i }, count);
    count += 1;
  }
  return count;
}

export function rebuildMeadowFlowers(
  meshes: FlowerMeshes,
  dummy: Object3D,
  center: { x: number; z: number },
  layout: { radius: number; perCell: number },
): void {
  let count = 0;
  for (let dx = -layout.radius; dx <= layout.radius; dx += 1) {
    for (let dz = -layout.radius; dz <= layout.radius; dz += 1) {
      count = placePatch(meshes, dummy, { x: center.x + dx, z: center.z + dz }, layout.perCell, count);
    }
  }
  for (const mesh of [meshes.stems, meshes.flowers]) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
}
