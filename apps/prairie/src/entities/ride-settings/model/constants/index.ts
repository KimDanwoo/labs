import { CAMERA } from '@shared/config';

export const CAMERA_MODE = { close: 'close', wide: 'wide' } as const;
export type CameraMode = (typeof CAMERA_MODE)[keyof typeof CAMERA_MODE];

export const CAMERA_PRESETS = {
  [CAMERA_MODE.close]: { distance: CAMERA.followDistance, height: CAMERA.followHeight },
  [CAMERA_MODE.wide]: { distance: 14, height: 4.8 },
} as const;
