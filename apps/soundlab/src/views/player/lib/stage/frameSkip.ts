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

  /**
   * 같은 그림을 다시 그리는 프레임은 버린다 — 파티클 8만 개 + 전면 4패스가 통째로 빠진다.
   * 기준은 "마지막으로 그린 프레임"이라, 조금씩 수렴하는 동안은 자동으로 프레임을 띄엄띄엄 그린다.
   * 감쇠가 살아 있으면 입력이 같아도 누적 버퍼가 계속 변하므로 그때는 건너뛰지 않는다.
   */
  function isRedundant(morph: number, level: number, decay: number, rippleAlive: boolean) {
    if (dirty || rippleAlive || hadRipple) return false;
    if (decay > STATIC_DECAY) return false;
    if (Math.abs(morph - drawnMorph) > MORPH_EPSILON) return false;
    return Math.abs(level - drawnLevel) <= LEVEL_EPSILON;
  }

  // 악센트가 살아 있으면 매 프레임 그린다 — 들이쉼·릴리스는 짧아서 건너뛰면 툭툭 끊긴다.
  // 끝난 직후 한 프레임도 그려야 수축·블룸이 화면에서 지워진다(hadRipple과 같은 이유).
  function shouldSkip({ morph, level, decay, rippleAlive, accented }: FrameInput) {
    if (!accented && !hadAccent && isRedundant(morph, level, decay, rippleAlive)) return true;
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
