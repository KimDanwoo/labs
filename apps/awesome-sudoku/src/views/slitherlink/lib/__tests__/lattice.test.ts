import { edgeBetween, latticeDistance, stepToward } from '@views/slitherlink/lib/lattice';
import { getTopology } from '@views/slitherlink/lib/topology';
import { describe, expect, it } from 'vitest';

const SIZE = 3;
const topology = getTopology(SIZE);

describe('격자 이동', () => {
  it('이웃한 두 점 사이의 변을 찾고, 이웃이 아니면 null을 준다', () => {
    expect(edgeBetween(topology, 0, 1)).toBe(0);
    expect(edgeBetween(topology, 0, 4)).toBe(12);
    expect(edgeBetween(topology, 0, 5)).toBeNull();
  });

  it('목표 쪽으로 한 칸씩, 더 먼 축부터 움직인다', () => {
    expect(stepToward(SIZE, 0, 3)).toBe(1);
    expect(stepToward(SIZE, 0, 12)).toBe(4);
    expect(stepToward(SIZE, 15, 0)).toBe(11);
  });

  it('맨해튼 거리를 센다', () => {
    expect(latticeDistance(SIZE, 0, 15)).toBe(6);
  });
});
