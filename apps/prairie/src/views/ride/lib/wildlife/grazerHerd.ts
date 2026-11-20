import type { InstancedMesh, Object3D } from 'three';
import {
  GRAZER_ALERT_RADIUS,
  GRAZER_BODY,
  GRAZER_COAST_MARGIN,
  GRAZER_DARK_SLOTS,
  GRAZER_EAR,
  GRAZER_EAR_COUNT,
  GRAZER_EAR_SLOT,
  GRAZER_EYE,
  GRAZER_EYE_COUNT,
  GRAZER_EYE_SLOTS,
  GRAZER_FLEE_RADIUS,
  GRAZER_FLEE_SPEED,
  GRAZER_FUR_SLOTS,
  GRAZER_GRAZE,
  GRAZER_HEAD,
  GRAZER_HEAD_SLOT,
  GRAZER_HERD_SIZE,
  GRAZER_LEG,
  GRAZER_LEG_COUNT,
  GRAZER_NECK,
  GRAZER_RESPAWN_DISTANCE,
  GRAZER_RESPAWN_SEED,
  GRAZER_RESPAWN_SPREAD,
  GRAZER_RIVER_CLEARANCE,
  GRAZER_RIVER_PUSH,
  GRAZER_SPAWN,
  GRAZER_STRIDE,
} from '../../config/grazers';
import { RIVER_TRENCH_HALF_WIDTH } from '../../config/scene';
import { createCreatureState, habitatSeed, updateCreature, type CreatureState } from '../../model/wildlife/behavior';
import { coastDistanceAt, distanceToRiver, nearestRiverX, riverWidthAt, terrainHeightAt } from '../scene/terrain';

export interface Grazer extends CreatureState {
  x: number;
  z: number;
  heading: number;
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

type Vec3 = readonly [number, number, number];

const CELL_SIZE = 100;

export function spawnHerd(): Grazer[] {
  return Array.from({ length: GRAZER_HERD_SIZE }, (_, i) => ({
    ...createCreatureState(),
    x: GRAZER_SPAWN.x + Math.cos(i * GRAZER_SPAWN.angleStep) * (GRAZER_SPAWN.radiusX + i),
    z: GRAZER_SPAWN.z + Math.sin(i * GRAZER_SPAWN.angleStep) * (GRAZER_SPAWN.radiusZ + i * 2),
    heading: i * GRAZER_SPAWN.headingStep,
  }));
}

function respawnNear(animal: Grazer, rider: Point3, index: number): void {
  const cx = Math.round(rider.x / CELL_SIZE),
    cz = Math.round(rider.z / CELL_SIZE);
  const spread = (salt: number) =>
    (habitatSeed(cx, cz, index + salt) - GRAZER_RESPAWN_SEED.center) * GRAZER_RESPAWN_SPREAD;
  animal.x = cx * CELL_SIZE + spread(GRAZER_RESPAWN_SEED.x);
  animal.z = cz * CELL_SIZE + spread(GRAZER_RESPAWN_SEED.z);
  animal.alert = 0;
  animal.rest = 0;
}

function keepOnLand(animal: Grazer): void {
  if (distanceToRiver(animal.x, animal.z) < RIVER_TRENCH_HALF_WIDTH + GRAZER_RIVER_CLEARANCE)
    animal.x =
      nearestRiverX(animal.x, animal.z) - (RIVER_TRENCH_HALF_WIDTH + GRAZER_RIVER_PUSH) * riverWidthAt(animal.z);
  animal.z -= Math.max(0, coastDistanceAt(animal.x, animal.z) + GRAZER_COAST_MARGIN);
}

export function stepGrazer(animal: Grazer, rider: Point3, index: number, t: number, dt: number): number {
  if (Math.hypot(animal.x - rider.x, animal.z - rider.z) > GRAZER_RESPAWN_DISTANCE) respawnNear(animal, rider, index);
  keepOnLand(animal);
  const y = terrainHeightAt(animal.x, animal.z);
  const distance = Math.hypot(animal.x - rider.x, y - rider.y, animal.z - rider.z);
  updateCreature(animal, distance, GRAZER_ALERT_RADIUS, dt);
  if (distance < GRAZER_FLEE_RADIUS) animal.heading = Math.atan2(animal.x - rider.x, animal.z - rider.z);
  const speed = animal.alert * GRAZER_FLEE_SPEED;
  animal.x += Math.sin(animal.heading) * speed * dt;
  animal.z += Math.cos(animal.heading) * speed * dt;
  return (1 - animal.alert) * (GRAZER_GRAZE.base + GRAZER_GRAZE.amplitude * Math.sin(t * GRAZER_GRAZE.rate + index));
}

export interface GrazerMeshes {
  fur: InstancedMesh;
  dark: InstancedMesh;
  eyes: InstancedMesh;
}

export function placeGrazerParts(
  meshes: GrazerMeshes,
  d: Object3D,
  animal: Grazer,
  index: number,
  grazing: number,
  t: number,
): void {
  const bodyY = terrainHeightAt(animal.x, animal.z);
  const cos = Math.cos(animal.heading),
    sin = Math.sin(animal.heading);
  const part = (mesh: InstancedMesh, slot: number, x: number, py: number, z: number, scale: Vec3) => {
    d.position.set(animal.x + x * cos + z * sin, bodyY + py, animal.z - x * sin + z * cos);
    d.rotation.set(0, animal.heading, 0);
    d.scale.set(...scale);
    d.updateMatrix();
    mesh.setMatrixAt(slot, d.matrix);
  };
  const dip = (spec: { y: number; dip: number }) => spec.y - grazing * spec.dip;
  const furSlot = index * GRAZER_FUR_SLOTS,
    darkSlot = index * GRAZER_DARK_SLOTS,
    eyeSlot = index * GRAZER_EYE_SLOTS;
  part(meshes.fur, furSlot, GRAZER_BODY.x, GRAZER_BODY.y, GRAZER_BODY.z, GRAZER_BODY.scale);
  part(meshes.fur, furSlot + 1, GRAZER_NECK.x, dip(GRAZER_NECK), GRAZER_NECK.z, GRAZER_NECK.scale);
  for (let leg = 0; leg < GRAZER_LEG_COUNT; leg++) {
    const phase = t * GRAZER_STRIDE.rate + leg * Math.PI + (leg > 1 ? Math.PI : 0);
    const stride = Math.sin(phase) * animal.alert * GRAZER_STRIDE.amplitude;
    const x = leg % 2 ? GRAZER_LEG.x : -GRAZER_LEG.x;
    const z = (leg < 2 ? GRAZER_LEG.z : -GRAZER_LEG.z) + stride;
    part(meshes.dark, darkSlot + leg, x, GRAZER_LEG.y + Math.max(0, stride), z, GRAZER_LEG.scale);
  }
  part(meshes.dark, darkSlot + GRAZER_HEAD_SLOT, GRAZER_HEAD.x, dip(GRAZER_HEAD), GRAZER_HEAD.z, GRAZER_HEAD.scale);
  for (let ear = 0; ear < GRAZER_EAR_COUNT; ear++) {
    const x = ear ? GRAZER_EAR.x : -GRAZER_EAR.x;
    part(meshes.dark, darkSlot + GRAZER_EAR_SLOT + ear, x, dip(GRAZER_EAR), GRAZER_EAR.z, GRAZER_EAR.scale);
  }
  for (let side = 0; side < GRAZER_EYE_COUNT; side++) {
    const x = side ? GRAZER_EYE.x : -GRAZER_EYE.x;
    part(meshes.eyes, eyeSlot + side, x, dip(GRAZER_EYE), GRAZER_EYE.z, GRAZER_EYE.scale);
  }
}
