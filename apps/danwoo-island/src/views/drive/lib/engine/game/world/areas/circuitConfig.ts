import type { RigidBody } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';
import type { AudioItem } from '../../audioItem';
import type { WorldObject } from '../../objectColliders';

export type CircuitState = 'pending' | 'starting' | 'running' | 'ending';
export type RaceOutcome = 'finished' | 'aborted';
export interface Checkpoint {
  readonly position: THREE.Vector3;
  readonly rotation: number;
  readonly scale: number;
  readonly respawnPosition: THREE.Vector3;
  readonly a: THREE.Vector2;
  readonly b: THREE.Vector2;
}
export interface Door {
  readonly mesh: THREE.Mesh;
  readonly scale: THREE.UniformNode<'float', number>;
}
export interface Obstacle {
  readonly object: WorldObject;
  readonly basePosition: THREE.Vector3;
  readonly side: THREE.Vector3;
  readonly phase: number;
}
export interface CircuitSounds {
  readonly countdown: AudioItem;
  readonly go: AudioItem;
  readonly checkpoint: AudioItem;
  readonly finish: AudioItem;
  readonly applause: AudioItem;
}
export interface Podium {
  readonly object: WorldObject;
  readonly confettiPositions: readonly [THREE.Vector3, THREE.Vector3];
  readonly viewFocusPosition: THREE.Vector3;
  confettiIndex: number;
}
export const CHECKPOINT = { radius: 2, respawnOffset: 3, respawnElevation: 4 } as const;
export const DOOR = { size: 2, intensity: 2, speed: 0.2, targetColor: '#32ffc1', reachedColor: '#cbff62' } as const;
export const COUNTDOWN_INTERVAL = 2;
export const LIGHT_STEP = 0.01;
export const OBSTACLE = { frequency: 1.25, amplitude: 5 } as const;
export const BOUNDS_THRESHOLD = 0;
export const RESPAWN_UNLOCK_DELAY = 2;
export const FINISH_DELAY: Record<RaceOutcome, number> = { finished: 4, aborted: 1 };
export const APPLAUSE_DELAY = 2;
export const END_MODAL_DELAY = 1;
export const PODIUM_FOCUS_OFFSET = new THREE.Vector3(-4, 0, -3);
export const PODIUM_CONFETTI_DELAY = { min: 2, spread: 3 } as const;
export const TIMER_PLAYER_OFFSET = { x: -2, z: 1 } as const;
export const BANNER = { speed: 10, phase: 0.5, base: 0.5, amplitude: 0.5 } as const;
export const RACE_WEATHER = { humidity: 0, electricField: 0, clouds: 0, wind: 0 } as const;
export const RACE_DAY = { progress: 0.85, fogNearRatio: 0.65, fogFarRatio: 1.25 } as const;
export const RESTART_ACTION = {
  name: 'circuitRestart',
  categories: ['racing'],
  keys: ['Keyboard.KeyR', 'Gamepad.select'],
};
export function requireMesh(object: THREE.Object3D): THREE.Mesh {
  if (!(object instanceof THREE.Mesh)) throw new Error(`Circuit object is not a mesh: ${object.name}`);
  return object;
}
export function requireBody(object: WorldObject): RigidBody {
  const body = object.physical?.body;
  if (!body) throw new Error('Circuit object has no physical body');
  return body;
}
export function createCheckpoint(reference: THREE.Object3D): Checkpoint {
  reference.rotation.reorder('YXZ');
  reference.visible = false;
  const position = reference.position.clone();
  const rotation = reference.rotation.y;
  const scale = reference.scale.x * 0.5;

  const direction = new THREE.Vector2(CHECKPOINT.respawnOffset, 0).rotateAround(new THREE.Vector2(), rotation);
  const respawnPosition = position.clone();
  respawnPosition.x += direction.y;
  respawnPosition.y = CHECKPOINT.respawnElevation;
  respawnPosition.z += direction.x;

  const center = new THREE.Vector2(position.x, position.z);
  const a = new THREE.Vector2(position.x - scale, position.z).rotateAround(center, -rotation);
  const b = new THREE.Vector2(position.x + scale, position.z).rotateAround(center, -rotation);
  return { position, rotation, scale, respawnPosition, a, b };
}
export function startingLightsMesh(reference: THREE.Object3D): THREE.Mesh {
  const mesh = requireMesh(reference);
  mesh.visible = false;
  return mesh;
}
