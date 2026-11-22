import type { RigidBody } from '@dimforge/rapier3d-compat';
import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';
import type * as THREE from 'three/webgpu';

export interface Ball {
  readonly object: WorldObject;
  readonly body: RigidBody;
  readonly radius: number;
  readonly kickoff: THREE.Vector3;
  isSleeping: boolean;
}

export const BALL = {
  mass: 0.12,
  restitution: 0.75,
  friction: 0.05,
  frictionRule: 'min',
  linearDamping: 0.9,
  angularDamping: 0.6,
  contactThreshold: 2,
  bumpVolume: 0.5,
  bumpForce: [2, 8],
} as const;

export const GOAL_PAUSE = 0.7;
export const KICKOFF_SPREAD = 2;
export const SCOREBOARD_X = -9.5;
export const SLEEP_DELAY_FRAMES = 2;
export const GOAL_CONFETTI_OFFSETS = [
  [-1, 1.5, -2],
  [-1, 1.5, 2],
] as const;
const ZERO = { x: 0, y: 0, z: 0 } as const;

export function resetBody(body: RigidBody, position: THREE.Vector3, rotation?: THREE.Quaternion): void {
  body.setTranslation(position, false);
  if (rotation) body.setRotation(rotation, false);
  body.resetForces(false);
  body.resetTorques(false);
  body.setLinvel(ZERO, false);
  body.setAngvel(ZERO, false);
}

export function requireBody(object: WorldObject): RigidBody {
  const body = object.physical?.body;
  if (!body) throw new Error('Beach goal object has no physical body');
  return body;
}
