import type { RigidBody } from '@dimforge/rapier3d-compat';
import type { InstanceReference } from '@views/drive/lib/engine/game/instancedGroup';
import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';
import { color, Fn, positionGeometry, step, texture, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export interface Pin {
  readonly index: number;
  readonly group: InstanceReference;
  readonly object: WorldObject;
  readonly body: RigidBody;
  readonly basePosition: THREE.Vector3;
  readonly baseRotation: THREE.Quaternion;
  isDown: boolean;
  isSleeping: boolean;
}
export interface Ball {
  readonly body: RigidBody;
  readonly basePosition: THREE.Vector3;
  readonly position: THREE.Vector3;
  isSleeping: boolean;
  speed: number;
}
export interface Screen {
  readonly group: THREE.Object3D;
  readonly object: WorldObject;
  readonly home: THREE.Vector3;
  readonly lane: THREE.Vector3;
  readonly labelStrike: THREE.Object3D;
  readonly pinStates: Uint8Array;
  readonly dataTexture: THREE.DataTexture;
  travel: number;
}
export interface Bumpers {
  readonly mesh: THREE.Object3D;
  readonly body: RigidBody;
  readonly object: WorldObject;
  readonly height: number;
  progress: number;
  isActive: boolean;
}
const PIN_SLOTS = 10;
export const PIN_DOWN_UP_Y = 0.5;
export const PIN_DOWN_VALUE = 128;
export const PIN_MASS = 0.02;
export const SLEEP_DELAY_FRAMES = 2;
export const BOUNDING_INTERVAL = 0.2;
export const SCREEN = { travel: 28.2 - 3.81, easing: 2, offset: 0.1, activeTolerance: 0.1 } as const;
export const STRIKE_BLINK = { period: 3, visible: 1.5 } as const;
export const STRIKE_CONFETTI_OFFSETS = [new THREE.Vector3(-1, -1, 0), new THREE.Vector3(-3.4, -1, 0)] as const;
export const BUMPER_DURATION = 1;
const ZERO = { x: 0, y: 0, z: 0 } as const;
export const LANE_AXIS = new THREE.Vector3(1, 0, 0);
export function worldPose(object: THREE.Object3D): THREE.Object3D {
  const pose = new THREE.Object3D();
  object.matrixWorld.decompose(pose.position, pose.quaternion, pose.scale);
  return pose;
}
export function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object instanceof THREE.Mesh;
}
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
  if (!body) throw new Error('Bowling object has no physical body');
  return body;
}
export function screenTexture(): { pinStates: Uint8Array; dataTexture: THREE.DataTexture } {
  const pinStates = new Uint8Array(PIN_SLOTS);
  const dataTexture = new THREE.DataTexture(
    pinStates,
    PIN_SLOTS,
    1,
    THREE.RedFormat,
    THREE.UnsignedByteType,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.NearestFilter,
    THREE.NearestFilter,
  );
  dataTexture.needsUpdate = true;
  return { pinStates, dataTexture };
}
export function pinIndicatorMaterial(
  dataTexture: THREE.DataTexture,
  { hex, strength, threshold }: { hex: string; strength: number; threshold: number },
): THREE.MeshBasicNodeMaterial {
  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = vec4(uniform(color(hex)).mul(uniform(strength)), 1);
  material.positionNode = Fn(() => {
    const isActive = step(texture(dataTexture, uv()).r.sub(threshold).abs(), SCREEN.activeTolerance);
    const newPosition = positionGeometry.toVar();
    newPosition.z.subAssign(isActive.oneMinus().mul(SCREEN.offset));
    return newPosition;
  })();
  return material;
}
export function strikeLabelMaterial(label: THREE.Object3D): THREE.MeshBasicNodeMaterial {
  const isSingleMaterialMesh = isMesh(label) && !Array.isArray(label.material);
  const map = isSingleMaterialMesh ? Reflect.get(label.material, 'map') : null;
  if (!(map instanceof THREE.Texture)) throw new Error('Bowling strike label has no texture');
  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = Fn(() => {
    texture(map).r.lessThan(0.5).discard();
    return vec4(vec3(2), 1);
  })();
  return material;
}
