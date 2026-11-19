import { vec3 } from 'three/tsl';
import type { InstanceReference } from '../../instancedGroup';
import type { WorldObject } from '../../objectColliders';

export interface Coconut {
  reference: InstanceReference;
  object: WorldObject;
}
export const SPAWNABLE = 20;
export const ON_TABLE = 2;
export const COCONUT_MASS = 0.02;
export const TABLE_STACK = 0.25;
export const HIDDEN_LIFT = 99;
export const EMBERS = {
  count: 30,
  elevation: 3,
  radius: 0.4,
  size: 0.015,
  segments: 8,
  hideAt: 0.8,
  hideLift: 100,
} as const;
export const EMBER_BOUNDS = { centerY: 1, radius: 1, delayFrames: 2 } as const;
export const BANNER_WIND_DIRECTION = vec3(0.5, 0, 1);
export const IMPULSE_DELAY_FRAMES = 2;
export const HEAT_PULSE = { scale: 2, duration: 2, delay: 0.2 } as const;
export function emberData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(EMBERS.count * 3);
  const scales = new Float32Array(EMBERS.count);
  for (let index = 0; index < EMBERS.count; index += 1) {
    const angle = Math.PI * 2 * Math.random();
    const radius = Math.random() ** 1.5 * EMBERS.radius;
    positions.set([Math.cos(angle) * radius, Math.random(), Math.sin(angle) * radius], index * 3);
    scales[index] = Math.random() * 1 + 0.75;
  }
  return { positions, scales };
}
