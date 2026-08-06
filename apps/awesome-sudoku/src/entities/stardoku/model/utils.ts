import { CELL_MARK, REGION_COLORS } from '@entities/stardoku/model/constants';
import { CellMark, MarkGrid } from '@entities/stardoku/model/types';

export const createEmptyMarks = (size: number): MarkGrid =>
  Array.from({ length: size }, () => Array<CellMark>(size).fill(CELL_MARK.EMPTY));

export const markAt = (marks: MarkGrid, row: number, col: number): CellMark => marks[row]?.[col] ?? CELL_MARK.EMPTY;

export const withMark = (marks: MarkGrid, row: number, col: number, mark: CellMark): MarkGrid =>
  marks.map((rowMarks, r) => (r === row ? rowMarks.map((m, c) => (c === col ? mark : m)) : rowMarks));

export const countStars = (marks: MarkGrid): number =>
  marks.reduce((total, row) => total + row.filter((mark) => mark === CELL_MARK.STAR).length, 0);

/** 보드 크기에 맞춰 팔레트 전체에 균등 분산 — 작은 판에서도 색 간격이 최대가 되게 */
export const regionColorClass = (regionId: number, boardSize: number): string => {
  const spread = Math.floor((regionId * REGION_COLORS.length) / Math.max(boardSize, 1));
  return REGION_COLORS[spread % REGION_COLORS.length] ?? '';
};
