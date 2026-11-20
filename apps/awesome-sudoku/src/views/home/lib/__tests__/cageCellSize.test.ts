import { describe, expect, it } from 'vitest';
import { DEFAULT_CELL_SIZE } from '../../config/board';
import { cellSizeFromPaths } from '../cageCellSize';

const pathAt = (x: number, id = 0) => ({ id, path: `M${x},0 L${x + 10},0` });

describe('케이지 경로로 셀 크기 추정', () => {
  it('첫 두 경로 시작점의 x 간격을 셀 크기로 쓴다', () => {
    expect(cellSizeFromPaths([pathAt(10), pathAt(90)])).toBe(80);
    expect(cellSizeFromPaths([pathAt(90), pathAt(10)])).toBe(80);
  });

  it('간격이 기본 크기보다 작으면 기본 크기를 쓴다', () => {
    expect(cellSizeFromPaths([pathAt(10), pathAt(11)])).toBe(DEFAULT_CELL_SIZE);
  });

  it('경로가 두 개 미만이거나 시작점을 읽을 수 없으면 기본 크기를 쓴다', () => {
    expect(cellSizeFromPaths([])).toBe(DEFAULT_CELL_SIZE);
    expect(cellSizeFromPaths([pathAt(10)])).toBe(DEFAULT_CELL_SIZE);
    expect(cellSizeFromPaths([{ id: 9, path: '' }, pathAt(10)])).toBe(DEFAULT_CELL_SIZE);
  });
});
