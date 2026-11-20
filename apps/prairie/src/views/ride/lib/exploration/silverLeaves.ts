import { Color, type InstancedMesh, type Object3D } from 'three';

export const silver = new Color('#dbe2c1');

const MAX_FRAME_DELTA = 0.05;
const TREE_RANGE = 24;
const DRIFT_BASE = 0.08;
const DRIFT_NEARBY = 0.12;
const PHASE_STEP = 0.618;
const GOLDEN_ANGLE = 2.39996;
const SWIRL = 0.8;
const FALL_START = 15;
const FALL_DISTANCE = 14;
const TUMBLE_RATE = 1.3;

export function nearbyShare(rider: { x: number; z: number }, tree: { x: number; z: number }): number {
  return Math.max(0, 1 - Math.hypot(rider.x - tree.x, rider.z - tree.z) / TREE_RANGE);
}

export function advanceDrift(driftTime: number, delta: number, nearby: number): number {
  return driftTime + Math.min(delta, MAX_FRAME_DELTA) * (DRIFT_BASE + nearby * DRIFT_NEARBY);
}

export function placeSilverLeaves(
  mesh: InstancedMesh,
  dummy: Object3D,
  count: number,
  driftTime: number,
  t: number,
): void {
  for (let i = 0; i < count; i++) {
    const phase = (driftTime + i * PHASE_STEP) % 1;
    const a = i * GOLDEN_ANGLE + phase * SWIRL;
    dummy.position.set(
      Math.cos(a) * (4 + (i % 6)) + phase * 2,
      FALL_START - phase * FALL_DISTANCE,
      Math.sin(a) * (4 + (i % 7)),
    );
    dummy.rotation.set(t + i, i, Math.sin(t * TUMBLE_RATE + i));
    dummy.scale.set(0.15, 0.32, 0.12);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, silver);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
