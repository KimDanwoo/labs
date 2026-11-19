import type { Point } from '../../src/views/drive/lib/engine/game/world/layout/islandLayout';
import { GROVE_RADIUS } from './groves';

export interface Room {
  readonly isLow?: boolean;
  readonly inland: number;
  readonly track: number;
  readonly pad: number;
}
export interface Planting extends Room {
  readonly isTall?: boolean;
  readonly count: readonly [min: number, max: number];
  readonly reach: readonly [from: number, to: number];
  readonly gap: number;
}
export const TREES: Planting = {
  isTall: true,
  count: [5, 9],
  reach: [0, GROVE_RADIUS],
  gap: 2.8,
  inland: 3,
  track: 4,
  pad: 3,
};
export const UNDERGROWTH: Planting = {
  isLow: true,
  count: [4, 7],
  reach: [3, GROVE_RADIUS + 3],
  gap: 2,
  inland: 2,
  track: 3,
  pad: 3.5,
};
export const BLOSSOMS: Planting = {
  isLow: true,
  count: [4, 8],
  reach: [0, GROVE_RADIUS + 4],
  gap: 1.5,
  inland: 2,
  track: 3,
  pad: 2,
};
export const THICKET = { isLow: true, spacing: 13, jitter: 0.8, inland: 3, track: 3, pad: 2.5 } as const;
export const THICKET_BUSHES: Planting = {
  isLow: true,
  count: [2, 5],
  reach: [0, 3.5],
  gap: 1.8,
  inland: 2,
  track: 3,
  pad: 3.5,
};
export const THICKET_FLOWERS: Planting = {
  isLow: true,
  count: [2, 5],
  reach: [0, 4.5],
  gap: 1.2,
  inland: 2,
  track: 3,
  pad: 2,
};
export const BEACH_PALMS = { spacing: 10, jitter: 0.8, beach: [2, 6], track: 4, pad: 3 } as const;
export const BEACH_PALM_PAIR: Planting = {
  isTall: true,
  count: [1, 3],
  reach: [0, 2.6],
  gap: 2.2,
  inland: 2,
  track: 4,
  pad: 3,
};
export const TRACK_TREES = { spacing: 6, jitter: 0.7, belt: [5, 8] } as const;
export const TRACK_HEDGE = { spacing: 4, jitter: 0.8, belt: [3.2, 5.5] } as const;
const SINGLE: Planting['count'] = [1, 1];
export const BELT_TREE: Planting = {
  isTall: true,
  count: SINGLE,
  reach: [0, 0],
  gap: 3.4,
  inland: 3,
  track: 4,
  pad: 3,
};
export const BELT_BUSH: Planting = { count: SINGLE, reach: [0, 0], gap: 2.2, inland: 2, track: 3, pad: 1.5 };
export const START_GARDEN = {
  palms: [[-3.2, -0.6]],
  rocks: [[3.2, 0.5]],
  bushes: [
    [-2.6, -1.6],
    [-3, 1.7],
  ],
  flowers: [
    [-1.8, 0.6],
    [-2.9, 0.9],
    [1.3, 1.9],
    [3, -1.4],
    [-0.8, -2.8],
    [0.5, 3],
  ],
} as const satisfies Record<string, readonly Point[]>;
export const CAMERA_SIDE: Point = [Math.SQRT1_2, Math.SQRT1_2];
export const TREE_COVER = { reach: 12, step: 2, pad: 3, respawn: 5 } as const;
export const SHORE_ROCKS = { spacing: 11, jitter: 0.8, shore: [-1, 2.5], track: 5, pad: 3 } as const;
