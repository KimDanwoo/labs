import type { Vector } from '@dimforge/rapier3d-compat';
import { getGame } from '@views/drive/lib/engine/game/gameContext';
import * as THREE from 'three/webgpu';

export type SuspensionState = 'low' | 'mid' | 'high';

export interface VehicleWheel {
  inContact: boolean;
  contactPoint: Vector | null;
  suspensionLength: number | null;
  lastTouchTime: number;
  readonly basePosition: THREE.Vector3;
}
export interface WheelSettings {
  offset: Vector;
  radius: number;
  directionCs: Vector;
  axleCs: Vector;
  frictionSlip: number;
  maxSuspensionForce: number;
  maxSuspensionTravel: number;
  sideFrictionStiffness: number;
  suspensionCompression: number;
  suspensionRelaxation: number;
}
export type VehicleEvents = {
  stop: [];
  start: [];
  upsideDown: [ratio: number];
  rightSideUp: [];
  stuck: [];
  unstuck: [];
  flip: [direction: number];
};
export const WHEEL_COUNT = 4;
export const STEERED_WHEELS = [0, 1];
export const WHEEL_SETTINGS: WheelSettings = {
  offset: { x: 0.9, y: 0, z: 0.75 },
  radius: 0.4,
  directionCs: { x: 0, y: -1, z: 0 },
  axleCs: { x: 0, y: 0, z: 1 },
  frictionSlip: 0.9,
  maxSuspensionForce: 150,
  maxSuspensionTravel: 2,
  sideFrictionStiffness: 3,
  suspensionCompression: 10,
  suspensionRelaxation: 2.7,
};
export const SUSPENSION_HEIGHTS: Record<SuspensionState, number> = { low: 0.88, mid: 1.23, high: 1.63 };
export const SUSPENSION_STIFFNESS: Record<SuspensionState, number> = { low: 20, mid: 30, high: 40 };
export const DRIVE = {
  steeringAmplitude: 0.5,
  engineForceAmplitude: 300,
  boostMultiplier: 2,
  topSpeed: 5,
  topSpeedBoost: 40,
  brakeAmplitude: 35,
  idleBrake: 0.06,
  reverseBrake: 0.4,
  idleAcceleration: 0.1,
  reverseSpeed: 0.5,
} as const;
export const STOP_THRESHOLDS = { low: 0.04, high: 0.7 } as const;
export const UPSIDE_DOWN_THRESHOLD = 0.3;
export const STUCK = { duration: 3, distance: 0.5, accelerating: 0.5 } as const;
export const FLIP = { force: 5, maxPitch: 1, minRoll: 5, pitchTorque: 0.8, rollTorque: 0.4 } as const;
export const ICE_FRICTION_SLIP = 0.04;
export const JUST_TOUCHED_WINDOW = 0.2;
export const FORWARD_RATIO_THRESHOLD = 0.5;
export const FIXED_STEP = 1 / 60;
export const SPAWN_POSITION = new THREE.Vector3(0, 4, 0);
export const CHASSIS_FRICTION = 0.4;
export const DOWN = new THREE.Vector3(0, -1, 0);
export const UP = new THREE.Vector3(0, 1, 0);
const SUSPENSION_STATES = new Set<unknown>(['low', 'mid', 'high']);
function isSuspensionState(value: unknown): value is SuspensionState {
  return SUSPENSION_STATES.has(value);
}
export function suspensionAt(index: number): SuspensionState {
  const value: unknown = getGame().player.suspensions[index];
  return isSuspensionState(value) ? value : 'low';
}
export function wheelPositions({ offset }: WheelSettings): THREE.Vector3[] {
  return [
    new THREE.Vector3(offset.x, offset.y, offset.z),
    new THREE.Vector3(offset.x, offset.y, -offset.z),
    new THREE.Vector3(-offset.x, offset.y, offset.z),
    new THREE.Vector3(-offset.x, offset.y, -offset.z),
  ];
}
