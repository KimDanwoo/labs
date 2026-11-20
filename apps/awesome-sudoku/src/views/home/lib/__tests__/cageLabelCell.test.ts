import { describe, expect, it } from 'vitest';
import { cageLabelCell } from '../cageLabelCell';

describe('케이지 합 숫자가 놓이는 칸', () => {
  it('가장 위 줄에서 가장 왼쪽 칸을 고른다', () => {
    const cage = {
      id: 1,
      sum: 12,
      cells: [
        [2, 4],
        [1, 5],
        [1, 3],
        [2, 3],
      ] as [number, number][],
    };
    expect(cageLabelCell(cage)).toEqual([1, 3]);
  });
});
