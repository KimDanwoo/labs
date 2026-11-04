import { describe, expect, it } from 'vitest';
import { atIndex, cellAt } from '../gridAccess';

describe('checked board access', () => {
  it('preserves zero, false and null values', () => {
    expect(atIndex([0], 0)).toBe(0);
    expect(atIndex([false], 0)).toBe(false);
    expect(cellAt([[null]], 0, 0)).toBeNull();
  });

  it('rejects invalid and sparse indices', () => {
    for (const index of [-1, 1, 0.5, NaN, Infinity]) {
      expect(() => atIndex([0], index)).toThrow(RangeError);
    }
    expect(() => atIndex(new Array<number>(1), 0)).toThrow(RangeError);
    expect(() => cellAt([[1]], 0, 1)).toThrow(RangeError);
    expect(() => cellAt([[1]], 1, 0)).toThrow(RangeError);
  });

  it('returns the original cell so updates affect the intended position', () => {
    const grid = [[{ value: 1 }]];
    cellAt(grid, 0, 0).value = 2;
    expect(grid).toEqual([[{ value: 2 }]]);
  });
});
