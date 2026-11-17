export type Point = readonly [x: number, z: number];

export type AreaKey =
  | 'achievements'
  | 'altar'
  | 'behindTheScene'
  | 'bowling'
  | 'career'
  | 'circuit'
  | 'cookie'
  | 'lab'
  | 'landing'
  | 'projects'
  | 'social'
  | 'timeMachine'
  | 'toilet';

export interface IslandShape {
  readonly name: string;
  readonly outline: readonly Point[];
}

export interface BridgeSpan {
  readonly from: Point;
  readonly to: Point;
  readonly width: number;
}

export interface AreaAnchor {
  readonly original: Point;
  readonly placed: Point;
  readonly footprint: Point;
}

export const WORLD_SIZE = 192;

export const TRACK = {
  width: 10,
  coastMargin: 14,
  centerline: [
    [16, 4],
    [16, 24],
    [18, 44],
    [24, 60],
    [36, 70],
    [52, 74],
    [68, 72],
    [82, 62],
    [84, 48],
    [72, 40],
    [56, 36],
    [50, 24],
    [58, 12],
    [76, 6],
    [88, -6],
    [84, -22],
    [66, -28],
    [54, -38],
    [58, -52],
    [76, -58],
    [86, -72],
    [76, -86],
    [52, -88],
    [30, -82],
    [10, -86],
    [-12, -88],
    [-28, -82],
    [-34, -70],
    [-26, -58],
    [-8, -54],
    [6, -46],
    [14, -30],
    [16, -12],
  ],
  waterJump: { from: [-2, -18], to: [30, -10] },
} as const satisfies {
  width: number;
  coastMargin: number;
  centerline: readonly Point[];
  waterJump: { from: Point; to: Point };
};

export const ISLANDS: readonly IslandShape[] = [
  {
    name: 'bowling',
    outline: [
      [-94, -50],
      [-72, -56],
      [-54, -50],
      [-46, -36],
      [-48, -14],
      [-58, -2],
      [-82, 0],
      [-95, -12],
      [-96, -34],
    ],
  },
  {
    name: 'plaza',
    outline: [
      [-42, -50],
      [-22, -52],
      [-6, -42],
      [-2, -18],
      [-4, 8],
      [-12, 30],
      [-30, 36],
      [-44, 26],
      [-48, 0],
      [-46, -26],
    ],
  },
  {
    name: 'career',
    outline: [
      [-94, 8],
      [-72, 6],
      [-56, 14],
      [-52, 32],
      [-58, 54],
      [-78, 60],
      [-95, 52],
      [-96, 28],
    ],
  },
  {
    name: 'landing',
    outline: [
      [-64, 64],
      [-40, 60],
      [-16, 60],
      [-2, 68],
      [0, 86],
      [-12, 95],
      [-40, 95],
      [-58, 92],
      [-68, 80],
    ],
  },
];

export const BRIDGES: readonly BridgeSpan[] = [
  { from: [-50, -26], to: [-42, -26], width: 5 },
  { from: [-58, 2], to: [-62, 8], width: 5 },
  { from: [-6, 2], to: [4, 4], width: 5 },
  { from: [-28, 32], to: [-30, 62], width: 5 },
  { from: [-62, 50], to: [-62, 66], width: 5 },
  { from: [-2, 80], to: [6, 80], width: 5 },
];

export const RESPAWN_AREAS: Readonly<Record<string, AreaKey>> = {
  achievements: 'achievements',
  altar: 'altar',
  beachStart: 'landing',
  behindTheScene: 'behindTheScene',
  bonfire: 'landing',
  bowling: 'bowling',
  bridge: 'social',
  career: 'career',
  circuit: 'circuit',
  controls: 'landing',
  cookie: 'cookie',
  lab: 'lab',
  landing: 'landing',
  onlyFans: 'social',
  projects: 'projects',
  social: 'social',
  test: 'social',
  timeMachine: 'timeMachine',
  toilet: 'toilet',
};

export const AREA_ANCHORS: Readonly<Record<AreaKey, AreaAnchor>> = {
  bowling: { original: [6.3, 66], placed: [-72, -28], footprint: [43, 25] },
  achievements: { original: [70.75, 8.9], placed: [-62, -12], footprint: [10, 14] },
  social: { original: [29, -25.2], placed: [-24, -8], footprint: [23, 18] },
  projects: { original: [34.8, 9.9], placed: [-30, -34], footprint: [12, 12] },
  lab: { original: [12.3, 15.55], placed: [-14, 16], footprint: [9, 10] },
  cookie: { original: [12.8, 34.75], placed: [-32, 18], footprint: [8, 10] },
  career: { original: [26.3, -1.75], placed: [-80, 24], footprint: [9, 18] },
  behindTheScene: { original: [50.65, -11.3], placed: [-14, -34], footprint: [8, 12] },
  timeMachine: { original: [-55.15, -67.3], placed: [-66, 42], footprint: [4, 5] },
  landing: { original: [50.2, 38.3], placed: [-38, 80], footprint: [21, 20] },
  toilet: { original: [65.75, 63.7], placed: [-14, 80], footprint: [14, 14] },
  altar: { original: [75.35, -27.35], placed: [-80, 42], footprint: [14, 15] },
  circuit: { original: [-11.3, -0.5], placed: [16, 4], footprint: [24, 24] },
};
