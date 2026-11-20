import { REGION_FILL_RATIO } from '@views/slitherlink/config/difficulty';
import { isSingleLoop, toLines } from '@views/slitherlink/lib/__tests__/loopCheck';
import { seededRandom } from '@views/slitherlink/lib/__tests__/seededRandom';
import { growLoopRegion, regionBoundary } from '@views/slitherlink/lib/loopRegion';
import { getTopology } from '@views/slitherlink/lib/topology';
import { describe, expect, it } from 'vitest';

const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);

describe('growLoopRegion', () => {
  it.each([3, 4, 5, 7, 10])('%i칸 판에서 영역 테두리는 언제나 닫힌 고리 하나다', (size) => {
    const topology = getTopology(size);
    for (const seed of SEEDS) {
      const region = growLoopRegion(size, seededRandom(seed));
      expect(isSingleLoop(toLines(regionBoundary(region, topology)), topology)).toBe(true);
    }
  });

  it('영역은 목표 넓이까지 자란다', () => {
    const size = 10;
    const target = Math.round(size * size * REGION_FILL_RATIO);
    for (const seed of SEEDS) {
      const area = growLoopRegion(size, seededRandom(seed)).filter(Boolean).length;
      expect(area).toBe(target);
    }
  });

  it('같은 시드는 같은 영역을 만든다', () => {
    expect(growLoopRegion(7, seededRandom(42))).toEqual(growLoopRegion(7, seededRandom(42)));
  });
});
