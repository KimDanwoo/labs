import * as THREE from 'three/webgpu';
import { QUALITY } from '../quality';

export const IDEAL_RATIO = 1920 / 1080;
export const CAMERA = { fov: 25, near: 0.1, far: 200 } as const;
export const THROTTLED_RESIZE_ORDER = 1;
export const FOCUS_ACTIONS = new Set([
  'forward',
  'right',
  'backward',
  'left',
  'boost',
  'brake',
  'respawn',
  'suspensions',
  'suspensionsFront',
  'suspensionsBack',
  'suspensionsRight',
  'suspensionsLeft',
  'suspensionsFrontLeft',
  'suspensionsFrontRight',
  'suspensionsBackRight',
  'suspensionsBackLeft',
  'interact',
  'whisper',
]);
export const ZOOM = {
  base: 0.6,
  speedAmplitude: -0.4,
  speedEdge: { min: 5, max: 40 },
  wheelSensitivity: 0.05,
  pinchSensitivity: 0.005,
  toggleStep: 0.01,
  smoothing: 10,
} as const;
export const SPHERICAL = {
  phiByQuality: { [QUALITY.high]: 0.31, [QUALITY.low]: 0.27 },
  theta: Math.PI * 0.25,
  radius: { min: 15, max: 30 },
  nonIdealRatioOffset: 9,
} as const;
export const FOCUS = { magnetMultiplier: 0.25, easingSpeed: 10 } as const;
export const OVERVIEW = { radius: 300, phi: Math.PI * 0.2, nearRatio: 0.3, farRatio: 2.4 } as const;
export const MAP_DRAG = { scale: 10, multiplier: 2, gamepadSpeed: 20 } as const;
export const MIN_PAN_TOUCHES = 2;
export interface FocusPoint {
  trackedPosition: THREE.Vector3;
  isTracking: boolean;
  position: THREE.Vector3;
  smoothedPosition: THREE.Vector3;
  easing: number;
  magnet: { active: boolean; multiplier: number };
}
export interface Zoom {
  baseRatio: number;
  ratio: number;
  smoothedRatio: number;
  toggle: number;
  toggleLast: number;
}
export interface Spherical {
  phi: number;
  theta: number;
  radius: { current: number };
  offset: THREE.Vector3;
}
