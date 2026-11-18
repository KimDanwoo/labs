import { Vector3 } from 'three';

export const forwardVec = new Vector3();

export const camDirVec = new Vector3();

export const desiredCam = new Vector3();

export const desiredTarget = new Vector3();

export const smoothTarget = new Vector3();

// 질주 시 FOV를 벌려 속도감을 준다.
export const SPRINT_FOV_BOOST = 8;

export const FOV_RESPONSE = 5;

export const RIG = {
  maxFrameDelta: 0.05,
  airborneDragFactor: 0.22,
  fullTurnSpeed: 4,
  dashSteerDamping: 0.55,
  collisionSpeedFactor: 0.5,
  floatClearance: 0.65,
  telemetryIntervalS: 0.15,
  fovEpsilon: 0.01,
  restingYawFade: { from: 0.5, to: 5 },
  framing: { fullSpeed: 24, distance: 2, height: 0.7, lookAhead: 2 },
  lerpFrameRate: 60,
} as const;
