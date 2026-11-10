import { CAMERA, CINEMATIC } from '../../config/scene';

export const CAMERA_MODE = { close: 'close', wide: 'wide', hero: 'hero' } as const;
export type CameraMode = (typeof CAMERA_MODE)[keyof typeof CAMERA_MODE];

export const CAMERA_PRESETS = {
  [CAMERA_MODE.close]: {
    distance: CAMERA.followDistance,
    height: CAMERA.followHeight,
    targetHeight: CAMERA.targetHeight,
    yaw: CINEMATIC.camera.restingYaw,
  },
  [CAMERA_MODE.wide]: {
    distance: 14,
    height: 4.8,
    targetHeight: CAMERA.targetHeight,
    yaw: CINEMATIC.camera.restingYaw,
  },
  [CAMERA_MODE.hero]: { distance: 5.8, height: 2.8, targetHeight: 2, yaw: -Math.PI * 0.72 },
} as const;
