import type { Triple } from '@views/drive/lib/engine/game/world/islandGeometry';
import * as THREE from 'three/webgpu';

export type DecorationKind = 'erase' | 'tentLeg' | 'keep';
export type Spot = readonly [number, number];
export const SIDES = [-1, 1] as const;
export const TENT_CANOPY = /^Cylinder0(22|37|39)$/;
export const START_LIGHT_FRAME_LIFT = 0.45;
const box3 = (min: Triple, max: Triple): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
export const CIRCUIT_DECORATION = {
  resetLetters: box3([-17.33, -0.03, 2.38], [-17.15, 0.47, 4.47]),
  courseBoard: box3([-18.9, -1.1, -3.1], [-17, 6.2, 5]),
  tires: [box3([-27.45, -1.05, -3.25], [-23.98, 0.5, 0.1]), box3([-2.35, -1.05, 10.9], [0.85, 0.5, 14.55])],
  clock: box3([-17.8, -1.05, 4.68], [-16.6, 0.6, 6.2]),
  gantry: box3([-14.6, -1.1, -18.3], [-0.1, 4, -14.6]),
  startLights: box3([-11.6, 2.2, -16.9], [-7.8, 3.6, -15.4]),
  tents: box3([-29, -1.1, -27], [-15, 2, -2]),
  dancerBases: [
    [-26.08, -16.23],
    [0, 0],
  ] satisfies readonly Spot[],
  bannerStands: [
    [-17.62, -15.69],
    [-17.48, -4.1],
  ] satisfies readonly Spot[],
  propReach: 0.8,
  groundPaintTop: -0.9,
  legMaxWidth: 0.25,
  legMinHeight: 1.5,
} as const;
