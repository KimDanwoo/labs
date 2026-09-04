import { describe, expect, it } from 'vitest';
import type { Grid } from '../types';
import { deepCopyGrid } from '../utils';

describe('스도쿠 유틸리티 함수 테스트', () => {
  const sampleGrid: Grid = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8],
  ];

  describe('deepCopyGrid', () => {
    it('그리드를 깊은 복사해야 함', () => {
      const copied = deepCopyGrid(sampleGrid);

      // 복사된 그리드가 원본과 같은 값을 가져야 함
      expect(copied).toEqual(sampleGrid);

      // 하지만 다른 참조를 가져야 함
      expect(copied).not.toBe(sampleGrid);
      expect(copied[0]).not.toBe(sampleGrid[0]);
    });

    it('원본 그리드를 수정해도 복사된 그리드에 영향을 주지 않아야 함', () => {
      const copied = deepCopyGrid(sampleGrid);
      const originalValue = sampleGrid[0][0];

      // 원본 수정
      sampleGrid[0][0] = 999;

      // 복사본은 변경되지 않아야 함
      expect(copied[0][0]).toBe(originalValue);

      // 원본 복원
      sampleGrid[0][0] = originalValue;
    });

    it('빈 그리드도 복사할 수 있어야 함', () => {
      const emptyGrid: Grid = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));
      const copied = deepCopyGrid(emptyGrid);

      expect(copied).toEqual(emptyGrid);
      expect(copied).not.toBe(emptyGrid);
    });
  });
});
