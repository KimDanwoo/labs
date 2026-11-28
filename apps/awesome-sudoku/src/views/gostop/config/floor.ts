export const FLOOR_TILT = {
  steps: 3,
  degPerStep: 0.75,
  pxPerStep: 0.5,
  rotatePrime: 3,
  xPrime: 5,
  yPrime: 2,
} as const;

export const FLOOR_FAN = [
  { rotate: 0, x: 0 },
  { rotate: 8, x: 2 },
  { rotate: -7, x: -2 },
  { rotate: 12, x: 3 },
] as const;

export const CHOICE_SPREAD = {
  start: [0, 1.1],
  center: [-0.55, 0.55],
  end: [-1.1, 0],
} as const;

export const CHOICE_DIRECTION: Record<number, keyof typeof CHOICE_SPREAD> = {
  1: 'start',
  2: 'center',
  3: 'end',
  4: 'start',
  5: 'center',
  6: 'end',
  7: 'start',
  8: 'center',
  9: 'end',
  10: 'start',
  11: 'center',
  12: 'end',
};

export const CHOICE_LIFT = 0.08;
