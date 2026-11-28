import { FLOOR_FAN, FLOOR_TILT } from '@views/gostop/config/floor';
import { floorPose, poseStyle } from '@views/gostop/lib/floorPose';
import { describe, expect, it } from 'vitest';

const IDS = Array.from({ length: 48 }, (_, id) => id);
const MAX_TILT = FLOOR_TILT.steps * FLOOR_TILT.degPerStep;

describe('바닥 패 자세', () => {
  it('같은 카드는 언제나 같은 기울기를 받는다', () => {
    expect(floorPose(17, 0, false)).toEqual(floorPose(17, 0, false));
    expect(poseStyle(floorPose(17, 0, false))).toEqual(poseStyle(floorPose(17, 0, false)));
  });

  it('맨 아래 패의 기울기는 작고 카드마다 다르다', () => {
    const tilts = IDS.map((id) => floorPose(id, 0, false).rotate);
    expect(Math.max(...tilts.map(Math.abs))).toBeLessThanOrEqual(MAX_TILT);
    expect(new Set(tilts).size).toBeGreaterThan(3);
  });

  it('쌓인 패는 부채처럼 서로 다른 쪽으로 펼쳐진다', () => {
    const fan = FLOOR_FAN.map((_, index) => floorPose(0, index, false).rotate);
    expect(new Set(fan).size).toBe(FLOOR_FAN.length);
    expect(floorPose(0, FLOOR_FAN.length + 2, false)).toEqual(floorPose(0, FLOOR_FAN.length - 1, false));
  });

  it('모이는 패는 기울기 없이 반듯하게 선다', () => {
    expect(floorPose(9, 2, true)).toEqual({ rotate: 0, x: 0, y: 0 });
  });
});
