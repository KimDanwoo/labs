import { CUT_IN_POWER, SHAKE } from '@views/gostop/config/playback';
import type { CutInTone } from '@views/gostop/model/types/playback';

const SHAKE_SIGN: Record<CutInTone, number> = { mine: 1, rival: -1 };

export const cutInPower = (level: number): number => Math.min(Math.max(level, CUT_IN_POWER.min), CUT_IN_POWER.max);

export const shakeAmplitude = (power: number): number =>
  SHAKE.basePx + SHAKE.stepPx * (cutInPower(power) - CUT_IN_POWER.min);

export function shakeFrames(power: number, tone: CutInTone): Keyframe[] {
  const amplitude = shakeAmplitude(power);
  return SHAKE.pattern.map((ratio) => ({
    transform: `translate(${SHAKE_SIGN[tone] * ratio * amplitude}px, ${Math.abs(ratio) * amplitude * SHAKE.dropRatio}px)`,
    easing: SHAKE.swingEasing,
  }));
}
