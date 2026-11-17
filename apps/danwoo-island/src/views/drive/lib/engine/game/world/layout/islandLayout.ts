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

export type Bounds = readonly [minX: number, minZ: number, maxX: number, maxZ: number];

export interface AreaAnchor {
  readonly original: Point;
  readonly placed: Point;
  readonly bounds: Bounds;
  readonly runUp?: Bounds;
  readonly rotation?: number;
}

export const WORLD_SIZE = 192;

export const TRACK = {
  width: 10,
  centerline: [
    [11.1, 0.2],
    [10.8, -10.6],
    [10.0, -21.5],
    [8.2, -31.8],
    [3.7, -42.2],
    [-6.4, -49.1],
    [-17.1, -50.0],
    [-27.5, -49.2],
    [-39.2, -49.2],
    [-49.6, -53.0],
    [-55.1, -61.1],
    [-53.4, -72.0],
    [-44.6, -78.2],
    [-34.3, -80.1],
    [-24.3, -79.8],
    [-12.5, -79.1],
    [-0.7, -77.6],
    [9.7, -75.8],
    [19.7, -75.9],
    [31.3, -77.2],
    [41.1, -80.2],
    [52.7, -82.2],
    [62.5, -80.5],
    [70.8, -74.4],
    [72.5, -63.4],
    [68.3, -53.3],
    [58.8, -47.5],
    [51.2, -39.4],
    [51.4, -29.5],
    [59.1, -21.7],
    [66.5, -14.9],
    [75.8, -7.6],
    [80.9, 1.4],
    [79.2, 11.2],
    [71.6, 17.5],
    [61.7, 20.6],
    [53.4, 28.4],
    [53.2, 39.1],
    [62.8, 44.8],
    [72.4, 47.5],
    [78.8, 55.7],
    [74.5, 66.2],
    [65.2, 71.5],
    [53.9, 72.1],
    [42.9, 72.2],
    [31.3, 74.1],
    [24.0, 67.3],
    [23.7, 57.4],
    [21.8, 47.3],
    [18.7, 36.0],
    [16.9, 25.1],
    [16.8, 13.9],
    [11.4, 5.6],
  ],
  waterJump: { from: [2, -10.5], to: [22, -7.5] },
  kickers: [
    [51.5, -22.25],
    [61.5, 24],
    [66.5, 46.5],
  ],
} as const satisfies {
  width: number;
  centerline: readonly Point[];
  waterJump: { from: Point; to: Point };
  kickers: readonly Point[];
};

export const ISLANDS: readonly IslandShape[] = [
  {
    name: 'circuit',
    outline: [
      [13.8, -93.8],
      [19.2, -93.8],
      [22.8, -89.2],
      [29.8, -85.2],
      [34.8, -85.2],
      [34.8, -90.2],
      [36.2, -91.2],
      [38.8, -91.2],
      [40.8, -88.8],
      [42.8, -88.8],
      [52.8, -93.2],
      [67.8, -92.2],
      [68.2, -93.8],
      [72.8, -93.8],
      [81.8, -85.8],
      [85.8, -85.2],
      [87.2, -83.2],
      [87.2, -80.8],
      [85.2, -79.8],
      [85.2, -78.2],
      [88.2, -73.8],
      [88.8, -68.2],
      [86.2, -64.8],
      [86.2, -62.8],
      [89.8, -62.2],
      [90.2, -59.8],
      [86.8, -60.2],
      [83.2, -58.8],
      [82.8, -55.8],
      [84.8, -52.2],
      [84.8, -46.8],
      [79.8, -42.2],
      [75.8, -41.2],
      [75.2, -37.2],
      [73.8, -36.2],
      [67.8, -36.8],
      [64.2, -35.2],
      [62.8, -34.2],
      [62.8, -31.8],
      [68.8, -27.2],
      [73.8, -26.8],
      [83.2, -21.8],
      [88.8, -15.8],
      [89.8, -10.2],
      [92.2, -5.8],
      [92.2, -0.8],
      [89.8, 4.2],
      [92.2, 12.2],
      [92.2, 17.2],
      [84.8, 22.8],
      [85.2, 29.2],
      [73.2, 31.2],
      [70.8, 33.8],
      [72.8, 36.8],
      [78.2, 36.8],
      [81.8, 40.8],
      [86.8, 43.8],
      [89.8, 47.8],
      [88.8, 53.8],
      [92.2, 60.8],
      [92.2, 68.8],
      [85.2, 66.2],
      [82.2, 68.2],
      [81.2, 72.2],
      [83.2, 75.2],
      [89.2, 76.2],
      [90.8, 85.2],
      [89.2, 86.2],
      [87.8, 91.2],
      [79.2, 92.8],
      [69.8, 92.2],
      [64.2, 93.8],
      [54.2, 93.2],
      [44.2, 88.8],
      [43.2, 87.2],
      [44.8, 83.2],
      [44.2, 81.2],
      [41.8, 79.8],
      [36.8, 79.2],
      [34.8, 74.2],
      [32.2, 73.2],
      [29.8, 69.8],
      [9.2, 52.8],
      [8.8, 37.2],
      [3.8, 20.2],
      [4.2, 6.2],
      [6.2, 1.2],
      [2.8, -2.2],
      [2.8, -4.2],
      [5.8, -6.8],
      [8.8, -5.8],
      [16.2, -6.8],
      [18.8, -5.8],
      [19.8, -9.8],
      [17.8, -11.8],
      [2.8, -11.8],
      [0.8, -13.2],
      [-0.2, -16.8],
      [-5.8, -21.8],
      [-6.8, -25.8],
      [-17.8, -36.8],
      [-22.8, -38.8],
      [-33.8, -39.2],
      [-36.8, -41.8],
      [-38.8, -41.8],
      [-44.2, -38.2],
      [-49.8, -38.8],
      [-60.8, -45.8],
      [-69.2, -56.2],
      [-69.8, -62.8],
      [-67.2, -66.8],
      [-67.2, -73.8],
      [-64.8, -80.2],
      [-57.2, -85.8],
      [-53.8, -91.2],
      [-50.2, -91.2],
      [-48.8, -89.2],
      [-46.8, -89.2],
      [-42.8, -91.8],
      [-30.8, -93.2],
      [-28.2, -91.8],
      [-21.2, -92.2],
      [-2.2, -89.8],
      [6.2, -92.2],
      [11.8, -91.2],
    ],
  },
  {
    name: 'bowling',
    outline: [
      [-83.8, -58.2],
      [-79.2, -58.2],
      [-75.8, -54.2],
      [-71.2, -52.2],
      [-66.8, -45.2],
      [-60.2, -39.8],
      [-57.2, -34.2],
      [-57.2, -31.2],
      [-60.8, -27.8],
      [-59.2, -9.2],
      [-61.2, -2.8],
      [-61.8, -1.2],
      [-67.2, 1.2],
      [-68.2, 3.2],
      [-67.8, 8.8],
      [-72.2, 11.2],
      [-74.2, 12.2],
      [-79.2, 10.2],
      [-84.2, 12.2],
      [-87.8, 11.2],
      [-93.2, -4.2],
      [-92.2, -10.8],
      [-93.8, -13.8],
      [-93.8, -18.8],
      [-91.2, -23.8],
      [-91.8, -34.8],
      [-88.8, -40.8],
      [-89.8, -49.8],
      [-86.2, -54.2],
      [-86.2, -56.8],
    ],
  },
  {
    name: 'plaza',
    outline: [
      [-32.8, -35.8],
      [-28.8, -35.8],
      [-23.8, -31.2],
      [-18.8, -30.2],
      [-16.8, -28.2],
      [-16.8, -25.2],
      [-3.8, -10.2],
      [-0.8, -4.2],
      [-3.8, 3.2],
      [-0.8, 6.8],
      [0.8, 16.2],
      [-0.2, 19.2],
      [-4.2, 23.8],
      [-11.8, 26.2],
      [-19.8, 34.2],
      [-28.2, 34.8],
      [-35.8, 32.2],
      [-43.2, 34.2],
      [-49.8, 34.2],
      [-51.8, 32.8],
      [-51.8, 29.2],
      [-53.8, 26.2],
      [-61.2, 24.8],
      [-64.8, 17.2],
      [-64.8, 13.8],
      [-58.2, 5.2],
      [-57.8, -2.8],
      [-55.8, -8.2],
      [-53.8, -10.2],
      [-53.8, -22.2],
      [-50.8, -25.8],
      [-50.8, -29.8],
      [-43.8, -34.2],
      [-36.8, -31.8],
    ],
  },
  {
    name: 'career',
    outline: [
      [-77.8, 19.2],
      [-73.8, 19.2],
      [-70.2, 21.2],
      [-59.8, 34.2],
      [-51.8, 39.2],
      [-49.2, 44.8],
      [-50.2, 53.2],
      [-54.2, 57.8],
      [-56.8, 63.8],
      [-62.2, 68.2],
      [-70.2, 68.2],
      [-81.2, 68.2],
      [-86.2, 64.8],
      [-90.2, 59.8],
      [-91.8, 55.8],
      [-92.8, 48.2],
      [-91.2, 38.8],
      [-91.8, 27.8],
      [-89.2, 22.8],
      [-85.8, 20.2],
      [-79.2, 20.2],
    ],
  },
  {
    name: 'landing',
    outline: [
      [-35.2, 55.8],
      [-29.2, 56.8],
      [-22.8, 62.2],
      [-18.2, 63.2],
      [-11.2, 62.8],
      [-4.2, 59.2],
      [-2.8, 56.8],
      [1.8, 56.8],
      [2.2, 58.2],
      [11.2, 57.8],
      [15.2, 64.2],
      [22.8, 66.8],
      [23.8, 72.8],
      [25.2, 73.8],
      [28.2, 81.8],
      [27.8, 85.8],
      [24.2, 89.2],
      [18.2, 91.8],
      [11.8, 91.8],
      [-1.2, 91.2],
      [-8.8, 93.2],
      [-20.2, 91.2],
      [-38.8, 91.8],
      [-48.2, 87.8],
      [-53.2, 81.8],
      [-55.8, 80.8],
      [-55.2, 75.2],
      [-51.2, 71.2],
      [-49.8, 65.8],
      [-45.8, 60.2],
      [-40.2, 59.2],
    ],
  },
];

export const BRIDGES: readonly BridgeSpan[] = [
  { from: [-66, 2], to: [-60, 6], width: 5 },
  { from: [-80.5, 8], to: [-80.5, 18], width: 5 },
  { from: [-65, 35], to: [-57, 29], width: 5 },
  { from: [-57, 68], to: [-48, 75], width: 5 },
];

export interface Pond {
  readonly center: Point;
  readonly radius: number;
}

export const PONDS: readonly Pond[] = [
  { center: [-17, 20], radius: 6 },
  { center: [-82, 54], radius: 4.5 },
  { center: [-78, -44], radius: 4.5 },
  { center: [62, 2], radius: 6.5 },
  { center: [50, 56], radius: 6 },
];

export interface Lagoon {
  readonly center: Point;
  readonly radii: Point;
}

export const LAGOON: Lagoon = { center: [-32, 46], radii: [17, 11] };

export interface RespawnPoint {
  readonly area: AreaKey;
  readonly offset: Point;
  readonly rotation: number;
}

export const RESPAWN_POINTS = {
  achievements: { area: 'achievements', offset: [-2, -10.5], rotation: -1.57 },
  altar: { area: 'altar', offset: [-0.6, 13.3], rotation: 1.12 },
  beachStart: { area: 'landing', offset: [-0.5, 2.5], rotation: -1.15 },
  behindTheScene: { area: 'behindTheScene', offset: [-1.8, -0.2], rotation: -0.19 },
  bonfire: { area: 'landing', offset: [4.9, 5.7], rotation: -2.2 },
  bowling: { area: 'bowling', offset: [15, -3.8], rotation: -2.59 },
  career: { area: 'career', offset: [0, 11.4], rotation: 1.57 },
  circuit: { area: 'circuit', offset: [0.7, 15.4], rotation: 0.04 },
  controls: { area: 'landing', offset: [-1, -6.5], rotation: 0 },
  cookie: { area: 'cookie', offset: [2.8, 1.6], rotation: 2.92 },
  lab: { area: 'lab', offset: [-7, 7], rotation: 1.57 },
  landing: { area: 'landing', offset: [-10.7, -0.5], rotation: -0.23 },
  projects: { area: 'projects', offset: [1, 7.7], rotation: 1.16 },
  social: { area: 'social', offset: [0, -11.5], rotation: -1.57 },
  timeMachine: { area: 'timeMachine', offset: [-3.4, -2.3], rotation: 0 },
  toilet: { area: 'toilet', offset: [5.2, 2.3], rotation: -2.89 },
} as const satisfies Record<string, RespawnPoint>;

export const AREA_ANCHORS: Readonly<Record<AreaKey, AreaAnchor>> = {
  bowling: {
    original: [6.3, 66],
    placed: [-62, -19],
    bounds: [-21.5, -12.7, 20.2, 12.7],
    runUp: [-21.5, -1.7, 45, 5.3],
  },
  achievements: { original: [70.75, 8.9], placed: [27, -48], bounds: [-5, -7, 5, 7] },
  social: { original: [29, -25.2], placed: [-41, 18], bounds: [-8.8, -8.6, 11.6, 8.8] },
  projects: { original: [34.8, 9.9], placed: [53, -63], bounds: [-4.6, -3.6, 5.6, 4.1] },
  lab: { original: [12.3, 15.55], placed: [-9.5, -3], bounds: [-4.5, -4.8, 4.5, 2.9] },
  cookie: { original: [12.8, 34.75], placed: [-58, 55], bounds: [-4.0, -4.8, 4.0, 4.8] },
  career: { original: [26.3, -1.75], placed: [-76.5, 29], bounds: [-4.3, -4.9, 4.3, 8.8] },
  behindTheScene: { original: [50.65, -11.3], placed: [-76.5, 77], bounds: [-4.3, -5.8, 4.2, 5.8] },
  timeMachine: { original: [-55.15, -67.3], placed: [2, -62], bounds: [-0.6, -2.3, 2.1, 2.5] },
  landing: { original: [50.2, 38.3], placed: [-28.5, 73], bounds: [-10.6, -10.1, 10.7, 9.8] },
  toilet: { original: [65.75, 63.7], placed: [7, 77], bounds: [-4.5, -3.7, 3.9, 5.7] },
  altar: { original: [75.35, -27.35], placed: [38, -3], bounds: [-6.8, -7.6, 6.8, 7.5] },
  circuit: { original: [-11.3, -0.5], placed: [18.2, 33.8], bounds: [-20.5, -11.7, 16.4, 33.9], rotation: 0.204 },
};

export function respawnPosition({ area, offset }: RespawnPoint): Point {
  const { placed } = AREA_ANCHORS[area];
  return [placed[0] + offset[0], placed[1] + offset[1]];
}

export const INTRO_RING = { offset: [0.6, -2], radius: 3.5 } as const satisfies { offset: Point; radius: number };

export function introRingCenter(): Point {
  const [x, z] = respawnPosition(RESPAWN_POINTS.beachStart);
  return [x + INTRO_RING.offset[0], z + INTRO_RING.offset[1]];
}
