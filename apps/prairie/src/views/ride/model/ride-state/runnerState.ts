import { Vector2, Vector3 } from 'three';

export const runnerState = {
  position: new Vector3(),
  heading: 0,
  speed: 0,
  waterDepth: 0,
  isSprinting: false,
  isSpinning: false,
  dashStrength: 0,
  spinAngle: 0,
  airborneHeight: 0,
  verticalSpeed: 0,
  landedAt: -1,
  landingImpact: 0,
  gustOrigin: new Vector2(),
  gustStartedAt: -1,
};
