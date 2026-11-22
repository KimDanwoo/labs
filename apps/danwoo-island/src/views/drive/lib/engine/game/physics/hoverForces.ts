import type { Vector } from '@dimforge/rapier3d-compat';
import type * as THREE from 'three/webgpu';

import { clamp, lerp } from '@views/drive/lib/engine/game/utilities/maths';
import { WORLD_SIZE } from '@views/drive/lib/engine/game/world/layout/islandLayout';

const EDGE = { limit: WORLD_SIZE / 2 + 12, stiffness: 2.5 } as const;

export interface YawTuning {
  readonly rate: number;
  readonly idleRatio: number;
  readonly topSpeed: number;
  readonly reverseSpeed: number;
}

export interface LevelTuning {
  readonly stiffness: number;
  readonly damping: number;
  readonly yawGain: number;
}

interface Attitude {
  readonly upward: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly spin: Vector;
  readonly yawRate: number;
}

export function edgePush(position: number): number {
  const overflow = Math.abs(position) - EDGE.limit;
  return overflow > 0 ? -Math.sign(position) * overflow * EDGE.stiffness : 0;
}

export function yawRate(steering: number, forwardSpeed: number, tuning: YawTuning): number {
  const isReversing = forwardSpeed < -tuning.reverseSpeed;
  const headway = lerp(tuning.idleRatio, 1, clamp(Math.abs(forwardSpeed) / tuning.topSpeed, 0, 1));
  return steering * tuning.rate * headway * (isReversing ? -1 : 1);
}

export function levelTorque(out: THREE.Vector3, attitude: Attitude, tuning: LevelTuning): THREE.Vector3 {
  const { upward, target, spin } = attitude;
  out.crossVectors(upward, target).multiplyScalar(tuning.stiffness);
  out.x -= spin.x * tuning.damping;
  out.z -= spin.z * tuning.damping;
  out.y = (attitude.yawRate - spin.y) * tuning.yawGain;
  return out;
}
