import * as THREE from 'three/webgpu';
import type { Track } from '../tracks';
import type { Trail } from '../trails';

export type PaintName = 'red' | 'orange' | 'white' | 'black' | 'flames' | 'abyssal';
export interface BlinkerCallbacks {
  left: (action: { active: boolean }) => void;
  right: (action: { active: boolean }) => void;
}
export interface Antenna {
  object: THREE.Object3D;
  head: THREE.Object3D;
  headAxle: THREE.Object3D;
  headReference: THREE.Object3D;
}
export interface BoostTrails {
  left: Trail;
  right: Trail;
  leftAnchor: THREE.Object3D;
  rightAnchor: THREE.Object3D;
}
export interface VisualWheel {
  container: THREE.Object3D;
  cylinder: THREE.Object3D;
  suspension: THREE.Object3D | null;
  painted: THREE.Mesh | null;
  groundTrack: Track;
}
const PART_NAMES = [
  'bodyPainted',
  'chassis',
  'blinkerLeft',
  'blinkerRight',
  'stopLights',
  'backLights',
  'wheelContainer',
  'antenna',
  'cell1',
  'cell2',
  'cell3',
  'energy',
] as const;
export type PartName = (typeof PART_NAMES)[number];
const PART_PATTERNS = PART_NAMES.map((name) => new RegExp(`^(${name})`, 'i'));
export const WHEEL_COUNT = 4;
export const MIRRORED_WHEELS = new Set([0, 2]);
export const BLINK_INTERVAL = 0.8;
export const STEERING_EASING = 16;
export const WHEEL_ROTATION_SCALE = 0.006;
export const WHEEL_MAX_Y = -0.5;
export const WHEEL_EASING = 25;
export const MAIN_TRACK_MAX_ELEVATION = 1.5;
export const BOOST = { speed: 1.2, easePower: 7 } as const;
export const TRAIL_OFFSETS = { left: [-1.28, 0.1, -0.55], right: [-1.28, 0.1, 0.55] } as const;
export const ANTENNA_TARGET = new THREE.Vector3(0, 2, 0);
export function findParts(model: THREE.Object3D): Map<string, THREE.Object3D> {
  const parts = new Map<string, THREE.Object3D>();
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
      child.receiveShadow = true;
      child.castShadow = true;
      child.material.shadowSide = THREE.BackSide;
    }
    for (const pattern of PART_PATTERNS) {
      const match = pattern.exec(child.name);
      if (match) parts.set(match[0], child);
    }
  });
  return parts;
}
export function trailAnchor(parent: THREE.Object3D, [x, y, z]: readonly [number, number, number]): THREE.Object3D {
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y, z);
  parent.add(anchor);
  return anchor;
}
