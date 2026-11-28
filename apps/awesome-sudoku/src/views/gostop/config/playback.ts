export const STEP_KIND = {
  DEAL: 'deal',
  LIFT: 'lift',
  PLAY: 'play',
  REVEAL: 'reveal',
  LAND: 'land',
  GATHER: 'gather',
  CAPTURE: 'capture',
  STEAL: 'steal',
  CALL: 'call',
  RESULT: 'result',
  ASK: 'ask',
} as const;

export const STEP_MS = {
  [STEP_KIND.DEAL]: 1150,
  [STEP_KIND.LIFT]: 320,
  [STEP_KIND.PLAY]: 340,
  [STEP_KIND.REVEAL]: 260,
  [STEP_KIND.LAND]: 320,
  [STEP_KIND.GATHER]: 300,
  [STEP_KIND.CAPTURE]: 360,
  [STEP_KIND.STEAL]: 320,
  [STEP_KIND.CALL]: 760,
  [STEP_KIND.RESULT]: 520,
  [STEP_KIND.ASK]: 160,
} as const;

export const TURN_MIN_MS = 1250;
export const REDUCED_STEP_MS = 120;

export const SPEED = {
  NORMAL: 'normal',
  FAST: 'fast',
} as const;

export const SPEED_FACTOR = {
  [SPEED.NORMAL]: 1,
  [SPEED.FAST]: 0.4,
} as const;

export const MOTION = {
  FULL: 'full',
  REDUCED: 'reduced',
} as const;

export const PLAYBACK_ACTION = {
  APPLY: 'apply',
  ADVANCE: 'advance',
} as const;

export const FLIGHT_RATIO = 0.86;
export const FLIGHT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const DEAL_FLIGHT_MS = 420;
export const DEAL_STAGGER_MS = 26;
export const FLIGHT_Z_INDEX = '30';
export const SIZE_EPSILON_PX = 0.5;

export const CUT_IN_MS = 850;

export const FLIGHT_ORIGIN = {
  DECK: 'deck',
  COMPUTER: 'computer',
} as const;

export const GAME_ID_RADIX = 36;
export const GAME_ID_BOUND = 2 ** 30;
export const GAME_ID_PARTS = 3;

export const CUT_IN_POWER = {
  min: 1,
  max: 3,
  stop: 2,
} as const;

export const SHAKE = {
  basePx: 5,
  stepPx: 2.5,
  dropRatio: 0.5,
  delayMs: 90,
  durationMs: 480,
  easing: 'linear',
  swingEasing: 'ease-out',
  pattern: [0, 1, -0.8, 0.55, -0.32, 0.12, 0],
} as const;
