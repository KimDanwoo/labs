import { RIVER } from '@views/ride/config/scene';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { WADE_SPLASH } from '@views/ride/model/runner/constants';
import { Object3D, Vector3 } from 'three';

export const WATER_Y = -RIVER.waterDrop;

export const RING_Y = WATER_Y + 0.06;

export const { maxDroplets, ringCount } = WADE_SPLASH;

export const dummy = new Object3D();

export const lookTarget = new Vector3();

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function splashIntensity(): number {
  const speed = Math.abs(runnerState.speed);
  const isInWater = runnerState.waterDepth >= WADE_SPLASH.minDepth && runnerState.airborneHeight <= 0;
  if (!isInWater) return 0;
  if (speed < WADE_SPLASH.minSpeed) return 0;
  return Math.min(speed / WADE_SPLASH.fullSplashSpeed, 1);
}
