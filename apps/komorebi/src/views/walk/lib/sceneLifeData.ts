import * as THREE from 'three';
import type { Region } from '../model/world/world';
import type { Bounds, Flight } from './flight';

export const INSECT = { butterfly: 'butterfly', dragonfly: 'dragonfly' } as const;
type Insect = (typeof INSECT)[keyof typeof INSECT];
type Patch = { kind: Insect; bounds: Bounds; count: [number, number] };
const patch = (
  kind: Insect,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  count: [number, number],
): Patch => ({
  kind,
  bounds: { minX, maxX, minZ, maxZ },
  count,
});
export const PATCHES: Record<Region, Patch[]> = {
  home: [],
  hallway: [],
  classroom: [],
  village: [
    patch(INSECT.butterfly, 4, 34, 44, 66, [2, 3]),
    patch(INSECT.butterfly, 62, 90, 52, 70, [0, 1]),
    patch(INSECT.dragonfly, 58, 84, 30, 42, [1, 2]),
  ],
  river: [patch(INSECT.dragonfly, 46, 70, 58, 88, [2, 3]), patch(INSECT.butterfly, 4, 26, 70, 92, [1, 2])],
  coast: [],
  forest: [patch(INSECT.butterfly, 24, 40, 32, 44, [1, 2]), patch(INSECT.butterfly, 72, 86, 32, 44, [1, 1])],
  school: [patch(INSECT.butterfly, 2, 18, 26, 42, [1, 2]), patch(INSECT.dragonfly, 22, 78, 40, 70, [1, 2])],
  shops: [patch(INSECT.butterfly, 26, 40, 40, 50, [1, 2])],
};
export const GULL_PATHS: Partial<Record<Region, { x: number; z: number; spread: number }[]>> = {
  coast: [
    { x: 72, z: 22, spread: 18 },
    { x: 58, z: 30, spread: 14 },
    { x: 84, z: 18, spread: 10 },
  ],
};
export const ATLAS = {
  butterfly: { url: '/art/butterflies.webp', frames: 4, aspect: 160 / 128 },
  dragonfly: { url: '/art/dragonflies.webp', frames: 4, aspect: 160 / 128 },
  gull: { url: '/art/gull.webp', frames: 3, aspect: 256 / 128 },
} as const;
export type Flyer = keyof typeof ATLAS;
export const WINGBEAT = [0, 1, 2, 1];
export const SIZE = { butterfly: 2.9, dragonfly: 3.4, gull: 2.6 };
export const DUSK = [0.25, 0.55] as const;
export const LANDING_EASE = 8;
export const ALTITUDE = { butterfly: [1.6, 0.5], dragonfly: [3.4, 1.2] } satisfies Record<Insect, [number, number]>;
export type Life = {
  region: Region;
  kind: Insect;
  bounds: Bounds;
  flight: Flight;
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  size: number;
  bob: number;
  lift: number;
  aloft: number;
  clock: number;
};
export const between = (min: number, max: number) => min + Math.random() * (max - min);
