export const SCENE_COLORS = {
  skyTop: '#6d9fae',
  skyBottom: '#f3dab0',
  fog: '#cbd0b9',
  sunLight: '#ffdda3',
  ambient: '#bbd4df',
  grass: '#536d43',
  grassBase: '#263f32',
  grassTip: '#9ab777',
  grassDry: '#dfc78e',
  path: '#a59a71',
  dust: '#ffe3ab',
  fillLight: '#c3dcf5',
  oceanHorizon: '#c5d4ce',
  waterDeep: '#376d70',
  waterShallow: '#8fae94',
  pebbleDark: '#8b8873',
  pebbleLight: '#b8ad91',
} as const;

export const WORLD = {
  groundSize: 1400,
  groundSegments: 100,
} as const;

export const RIVER = {
  firstX: 110,
  period: 1600,
  bends: [
    { amplitude: 20, frequency: 0.008 },
    { amplitude: 8, frequency: 0.021 },
  ],
  widthWaves: [
    { amplitude: 0.12, frequency: 0.013 },
    { amplitude: 0.06, frequency: 0.031 },
  ],
  halfWidth: 36,
  bankWidth: 7,
  length: 800,
  depth: 2.2,
  slopeStart: 15.5,
  waterDrop: 0.35,
  rippleHeight: 0.05,
  wadeSpeedScale: 0.5,
  wadeDepthRef: 0.8,
  grassFade: 14,
  grassMinHeight: 0.4,
  grassOverhang: 2.5,
} as const;

export const OCEAN = {
  coastZ: 900,
  beachWidth: 24,
  shelfLength: 150,
  depth: 6,
  estuaryStart: 500,
  estuaryEnd: 900,
  estuaryExpansion: 2.2,
} as const;

export const RIVER_TRENCH_HALF_WIDTH = RIVER.halfWidth + RIVER.bankWidth;

export const SUN = {
  position: [-80, 26, 110] as [number, number, number],
  intensity: 2.8,
  ambientIntensity: 0.8,
};

export const CINEMATIC = {
  exposure: 0.98,
  bloom: { strength: 0.18, radius: 0.45, threshold: 2.8 },
  dust: { desktop: 150, mobile: 55, radius: 40, height: 9 },
  camera: { restingYaw: -0.72, response: 1.8 },
} as const;

export const MEADOW_PATH = { length: 360, drift: 58, halfWidth: 1.6, edge: 1.4 } as const;

const MOBILE_FOG = { near: 36, far: 140 } as const;

export const FOG = {
  desktop: { near: 85, far: 360 },
  mobile: MOBILE_FOG,
  software: MOBILE_FOG,
} as const;

export type FogQuality = keyof typeof FOG;

export const HAZE = {
  radius: 1000,
  bottomY: -80,
  topY: 340,
  fadeStartY: 0,
  fadeTopY: 70,
} as const;

export const RIDGES = [
  { baseY: 30, ampY: 235, cells: 9, seed: 0.17, color: '#a6b5bf' },
  { baseY: 18, ampY: 155, cells: 17, seed: 0.53, color: '#81989d' },
  { baseY: 10, ampY: 85, cells: 29, seed: 0.81, color: '#607e79' },
] as const;

export const CAMERA = {
  fov: 50,
  near: 0.1,
  far: 1200,
  followDistance: 8.7,
  followHeight: 2.8,
  groundClearance: 1.8,
  targetHeight: 1.5,
  positionLerp: 0.1,
  targetLerp: 0.14,
} as const;

export const TERRAIN = {
  waves: [
    { amp: 4, kx: 0.021, kz: 0.013, phase: 0 },
    { amp: 2.5, kx: -0.011, kz: 0.027, phase: 1.7 },
    { amp: 1.2, kx: 0.047, kz: -0.031, phase: 0.6 },
  ],
  maskNear: 25,
  maskFar: 70,
} as const;

export const SKY_FILES = {
  coarse: '/environments/golden-meadow-1k.hdr',
  fine: '/environments/golden-meadow-2k.hdr',
} as const;
