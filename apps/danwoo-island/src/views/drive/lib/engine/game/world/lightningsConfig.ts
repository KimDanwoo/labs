import { alea } from 'seedrandom';
import * as THREE from 'three/webgpu';

export type Random = () => number;
export type FloatUniform = THREE.UniformNode<'float', number>;
const rng = alea('lightning');
export const NEAR_THUNDER = [
  'sounds/thunder/near/THUNDER_GEN-HDF-23300.mp3',
  'sounds/thunder/near/Lightning-Streak-with-Thunder-Crash_TTX028903.mp3',
  'sounds/thunder/near/ThunderSharpStrikingRumblingCrackling_JMDKp_04.mp3',
] as const;
export const DISTANT_THUNDER = [
  'sounds/thunder/distant/Thunder32GentleCr SIG014001.mp3',
  'sounds/thunder/distant/Thunder44LowRippl SIG015201.mp3',
] as const;
export const ANTICIPATION = { count: 32, duration: 5, scale: 0.07, elevation: 1.5, radius: 3 } as const;
export const ARC = {
  duration: 3,
  points: 15,
  height: 15,
  thickness: 0.1,
  easeOut: 5,
  drift: 1,
  colorReach: 8,
} as const;
export const EXPLOSION = {
  count: 128,
  duration: 4,
  fall: 1,
  scale: 0.1,
  radius: 3,
  easeOut: 8,
  colorReach: 4,
} as const;
export const STRIKE_EXPLOSION = { radius: 7, strength: 4, isVehicleOnly: true } as const;
export const DISTANT_SEED_OFFSET = 999;
export const RENDER_ORDER = 2;
export function pick<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}
export function anticipationData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(ANTICIPATION.count * 3);
  const scales = new Float32Array(ANTICIPATION.count);
  for (let index = 0; index < ANTICIPATION.count; index += 1) {
    const angle = Math.PI * 2 * rng();
    const radius = rng() * ANTICIPATION.radius;
    positions.set([Math.sin(angle) * radius, -rng(), Math.cos(angle) * radius], index * 3);
    scales[index] = rng() * 0.75 + 0.25;
  }
  return { positions, scales };
}
export function arcPoints(): THREE.Vector3[] {
  const step = ARC.height / (ARC.points - 1);
  return Array.from(
    { length: ARC.points },
    (_, index) => new THREE.Vector3((rng() - 0.5) * 1, index * step, (rng() - 0.5) * 1),
  );
}
export function explosionData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(EXPLOSION.count * 3);
  const scales = new Float32Array(EXPLOSION.count);
  for (let index = 0; index < EXPLOSION.count; index += 1) {
    const spherical = new THREE.Spherical(rng(), rng() * 0.5 * Math.PI, rng() * Math.PI * 2);
    new THREE.Vector3().setFromSpherical(spherical).toArray(positions, index * 3);
    scales[index] = rng() * 0.75 + 0.25;
  }
  return { positions, scales };
}
