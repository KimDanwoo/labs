export const GRAZER_HERD_SIZE = 8;
export const GRAZER_HERD_SIZE_LOW = 4;
export const GRAZER_FUR_SLOTS = 2;
export const GRAZER_DARK_SLOTS = 7;
export const GRAZER_EYE_SLOTS = 2;
export const GRAZER_HEAD_SLOT = 4;
export const GRAZER_EAR_SLOT = 5;
export const GRAZER_LEG_COUNT = 4;
export const GRAZER_EAR_COUNT = 2;
export const GRAZER_EYE_COUNT = 2;

export const GRAZER_SPAWN = { x: -35, z: 42, angleStep: 2.39996, radiusX: 5, radiusZ: 8, headingStep: 1.7 } as const;

export const GRAZER_MAX_DELTA = 0.05;
export const GRAZER_OFFSHORE_DISTANCE = 120;
export const GRAZER_RESPAWN_DISTANCE = 160;
export const GRAZER_RESPAWN_SPREAD = 160;
export const GRAZER_RESPAWN_SEED = { x: 80, z: 90, center: 0.5 } as const;
export const GRAZER_RIVER_CLEARANCE = 6;
export const GRAZER_RIVER_PUSH = 8;
export const GRAZER_COAST_MARGIN = 40;
export const GRAZER_ALERT_RADIUS = 12;
export const GRAZER_FLEE_RADIUS = 15;
export const GRAZER_FLEE_SPEED = 2.4;
export const GRAZER_GRAZE = { base: 0.65, amplitude: 0.35, rate: 0.7 } as const;
export const GRAZER_STRIDE = { rate: 9, amplitude: 0.18 } as const;

interface GrazerPart {
  x: number;
  y: number;
  dip: number;
  z: number;
  scale: readonly [number, number, number];
}

export const GRAZER_BODY: GrazerPart = { x: 0, y: 1.05, dip: 0, z: 0, scale: [0.55, 0.62, 0.85] };
export const GRAZER_NECK: GrazerPart = { x: 0, y: 1.3, dip: 0.65, z: 0.8, scale: [0.28, 0.32, 0.32] };
export const GRAZER_HEAD: GrazerPart = { x: 0, y: 1.25, dip: 0.75, z: 1.02, scale: [0.22, 0.18, 0.22] };
export const GRAZER_EAR: GrazerPart = { x: 0.3, y: 1.45, dip: 0.65, z: 0.8, scale: [0.19, 0.08, 0.12] };
export const GRAZER_EYE: GrazerPart = { x: 0.2, y: 1.4, dip: 0.65, z: 0.98, scale: [0.045, 0.045, 0.035] };
export const GRAZER_LEG = { x: 0.32, y: 0.35, z: 0.5, scale: [0.09, 0.38, 0.1] } as const;

export const GRAZER_EYE_GEOMETRY = [1, 8, 6] as const;
export const GRAZER_FUR_BUMP_SCALE = 0.12;
export const GRAZER_EYE_ROUGHNESS = 0.12;
