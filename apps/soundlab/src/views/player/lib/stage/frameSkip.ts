import { LEVEL_EPSILON, MORPH_EPSILON, STATIC_DECAY } from '@views/player/config/renderer';

export type FrameInput = {
  morph: number;
  level: number;
  decay: number;
  rippleAlive: boolean;
  accented: boolean;
};

export function createFrameSkip() {
  let dirty = true;
  let drawnMorph = 0;
  let drawnLevel = 0;
  let hadRipple = false;
  let hadAccent = false;

  function isRedundant(morph: number, level: number, decay: number, rippleAlive: boolean) {
    if (dirty) return false;
    if (rippleAlive) return false;
    if (hadRipple) return false;
    if (decay > STATIC_DECAY) return false;
    if (Math.abs(morph - drawnMorph) > MORPH_EPSILON) return false;
    return Math.abs(level - drawnLevel) <= LEVEL_EPSILON;
  }

  function shouldSkip({ morph, level, decay, rippleAlive, accented }: FrameInput) {
    const isIdleFrame = !accented && !hadAccent && isRedundant(morph, level, decay, rippleAlive);
    if (isIdleFrame) return true;
    dirty = false;
    drawnMorph = morph;
    drawnLevel = level;
    hadRipple = rippleAlive;
    hadAccent = accented;
    return false;
  }

  return {
    invalidate: () => {
      dirty = true;
    },
    shouldSkip,
  };
}
