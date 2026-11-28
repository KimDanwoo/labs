import { FLOOR_FAN, FLOOR_TILT } from '@views/gostop/config/floor';

export interface FloorPose {
  rotate: number;
  x: number;
  y: number;
}

const STILL: FloorPose = { rotate: 0, x: 0, y: 0 };

const spread = (id: number, prime: number): number => ((id * prime) % (FLOOR_TILT.steps * 2 + 1)) - FLOOR_TILT.steps;

const fanOf = (stackIndex: number) => FLOOR_FAN[Math.min(stackIndex, FLOOR_FAN.length - 1)] ?? STILL;

export function floorPose(id: number, stackIndex: number, isGathering: boolean): FloorPose {
  if (isGathering) return STILL;
  const fan = fanOf(stackIndex);
  return {
    rotate: spread(id, FLOOR_TILT.rotatePrime) * FLOOR_TILT.degPerStep + fan.rotate,
    x: spread(id, FLOOR_TILT.xPrime) * FLOOR_TILT.pxPerStep + fan.x,
    y: spread(id, FLOOR_TILT.yPrime) * FLOOR_TILT.pxPerStep,
  };
}

export const poseStyle = ({ rotate, x, y }: FloorPose) => ({ rotate: `${rotate}deg`, translate: `${x}px ${y}px` });
