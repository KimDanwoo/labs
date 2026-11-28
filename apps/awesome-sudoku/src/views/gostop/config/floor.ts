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
