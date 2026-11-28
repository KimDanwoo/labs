import { CUT_IN_POWER, SHAKE } from '@views/gostop/config/playback';
import { cutInPower, shakeFrames } from '@views/gostop/lib/cutIn';
import { describe, expect, it } from 'vitest';

const peakOf = (frames: Keyframe[]): number =>
  Math.max(...frames.map((frame) => Math.abs(Number(/translate\((-?[\d.]+)px/.exec(String(frame.transform))?.[1]))));

describe('컷인 세기', () => {
  it('세기를 정해진 범위로 묶는다', () => {
    expect(cutInPower(0)).toBe(CUT_IN_POWER.min);
    expect(cutInPower(9)).toBe(CUT_IN_POWER.max);
  });

  it('세기가 클수록 판이 크게 흔들리고 제자리에서 끝난다', () => {
    const weak = shakeFrames(1, 'mine');
    const strong = shakeFrames(3, 'mine');
    expect(peakOf(strong)).toBeGreaterThan(peakOf(weak));
    expect(strong).toHaveLength(SHAKE.pattern.length);
    expect(strong.at(-1)?.transform).toBe('translate(0px, 0px)');
  });

  it('내 컷인과 상대 컷인은 반대 방향으로 흔든다', () => {
    const [, mine] = shakeFrames(2, 'mine');
    const [, rival] = shakeFrames(2, 'rival');
    expect(String(mine?.transform).startsWith('translate(5px')).toBe(true);
    expect(String(rival?.transform).startsWith('translate(-5px')).toBe(true);
  });
});
