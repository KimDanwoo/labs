export const RUNNER_MODEL_URL = '/models/unicorn.glb';

export const RUNNER_MODEL_TRANSFORM = {
  scale: 0.55,
  rotationY: 0,
  position: [0, 0, 0] as [number, number, number],
};

export const RUNNER_ANIM = {
  idle: 'AnimalArmature|Idle',
  walk: 'AnimalArmature|Walk',
  flight: 'AnimalArmature|Gallop_Jump',
  run: 'AnimalArmature|Gallop',
} as const;

export const UNICORN_TINT: Record<string, string> = {
  Main: '#e2e2de',
  Main_Light: '#b7c6d2',
  Hair: '#647b99',
  Muzzle: '#8a9299',
  Hooves: '#aa8446',
  Eye_Black: '#152e36',
  Eye_White: '#eee9df',
};

export const RUNNER_FINISH = {
  gold: '#cda967',
  paleGold: '#f4ddb0',
  opal: '#72b8c5',
  iris: '#1c5b65',
  pupil: '#101b2b',
  maneRoot: '#293e62',
  maneTip: '#c3dce4',
  strands: 48,
} as const;

export const HORN = {
  boneScaleFix: 0.01,
  position: [0, 0.18, 0.4] as [number, number, number],
  tiltForward: 0.18,
  radius: 0.085,
  height: 1.2,
  bend: 0.12,
  color: '#e4c17f',
  ridgeColor: '#fff0c7',
} as const;

export const WINGS = {
  root: [0.42, 0.5, -0.35] as [number, number, number],
  span: 4.4,
  feathers: 26,
  foldedAngle: -0.12,
  foldedScale: 0.65,
  openAngleBase: 0.45,
  flapAmplitude: 0.65,
  flapSpeedAir: 3.2,
  flapSpeedRising: 5.5,
  color: '#eee9df',
  trimVisibleOpen: 0.2,
} as const;

export const FEATHER_SURFACE = {
  shaftSharpness: 35,
  shaftHeight: 0.003,
  barbAlong: 280,
  barbAcross: 100,
  barbHeight: 0.00035,
  barbFadeCycles: [0.2, 0.45],
  shaftFadeWidth: [0.5, 1.5],
  distanceFade: [8, 24],
} as const;

export const RUNNER_ANIM_TUNING = {
  runRefSpeed: 8.5,
  minRunScale: 0.6,
  maxRunScale: 2.2,
  blendRate: 9,
  walkRefSpeed: 2.6,
  gallopBlendStart: 4,
  gallopBlendEnd: 7,
} as const;

export const WADE_SPLASH = {
  minDepth: 0.05,
  minSpeed: 0.8,
  fullSplashSpeed: 10,
  maxDroplets: 256,
  emitPerSecond: 320,
  dropletMinSize: 0.08,
  dropletMaxSize: 0.26,
  upSpeedMin: 2.5,
  upSpeedMax: 7,
  sideSpeedMax: 3.2,
  forwardCarry: 0.35,
  stretchPerSpeed: 0.22,
  lifeMin: 0.45,
  lifeMax: 0.8,
  gravity: 12,
  spreadRadius: 1,
  landingBurst: 90,
  ringCount: 6,
  ringInterval: 0.14,
  ringLife: 1.1,
  ringStartRadius: 0.6,
  ringEndRadius: 3.4,
  ringOpacity: 0.55,
} as const;

export const SPRINT_TRAIL = {
  maxMotes: 120,
  emitPerSecond: 90,
  minSpeed: 5,
  sizeMin: 0.025,
  sizeMax: 0.07,
  lifeMin: 0.5,
  lifeMax: 1,
  backwardCarry: 0.12,
  rise: 0.9,
  jitter: 0.7,
  spawnHeight: 0.35,
  flyingHeight: 0.5,
  color: '#ffd27a',
} as const;

export const GROUND_SHADOW = {
  width: 1.6,
  length: 3.2,
  core: 0.3,
  opacity: 0.32,
  hover: 0.04,
  fadeHeight: 8,
  airSpread: 0.6,
  renderOrder: 1,
} as const;
