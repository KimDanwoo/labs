import { CELL_MARK, REGION_COLORS } from '@entities/stardoku/model/constants';
import { regionAt } from '@entities/stardoku/model/solver';
import { CellMark, CellPosition, MarkGrid, RegionGrid } from '@entities/stardoku/model/types';

export const createEmptyMarks = (size: number): MarkGrid =>
  Array.from({ length: size }, () => Array<CellMark>(size).fill(CELL_MARK.EMPTY));

export const markAt = (marks: MarkGrid, row: number, col: number): CellMark => marks[row]?.[col] ?? CELL_MARK.EMPTY;

export const withMark = (marks: MarkGrid, row: number, col: number, mark: CellMark): MarkGrid =>
  marks.map((rowMarks, r) => (r === row ? rowMarks.map((m, c) => (c === col ? mark : m)) : rowMarks));

export const countStars = (marks: MarkGrid): number =>
  marks.reduce((total, row) => total + row.filter((mark) => mark === CELL_MARK.STAR).length, 0);

export const cellKey = (row: number, col: number): string => `${row}-${col}`;

export const starPositions = (marks: MarkGrid): CellPosition[] => {
  const stars: CellPosition[] = [];
  marks.forEach((rowMarks, row) =>
    rowMarks.forEach((mark, col) => {
      if (mark === CELL_MARK.STAR) stars.push({ row, col });
    }),
  );
  return stars;
};

const conflicts = (a: CellPosition, b: CellPosition, regions: RegionGrid): boolean =>
  a.row === b.row ||
  a.col === b.col ||
  regionAt(regions, a.row, a.col) === regionAt(regions, b.row, b.col) ||
  (Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1);

/**
 * 별도쿠 규칙(행·열·구역 1개씩, 대각 포함 인접 금지)을 어기는 별들의 셀 키.
 * 정답 여부는 알려주지 않는다 — 규칙 위반은 판을 보면 사람도 아는 정보라서 표시해도 퍼즐이 안 쉬워진다.
 */
export const violatingStarKeys = (marks: MarkGrid, regions: RegionGrid): Set<string> => {
  const stars = starPositions(marks);
  const keys = new Set<string>();
  for (let i = 0; i < stars.length; i++)
    for (let j = i + 1; j < stars.length; j++) {
      const a = stars[i];
      const b = stars[j];
      if (!a || !b || !conflicts(a, b, regions)) continue;
      keys.add(cellKey(a.row, a.col));
      keys.add(cellKey(b.row, b.col));
    }
  return keys;
};

/** 보드 크기에 맞춰 팔레트 전체에 균등 분산 — 작은 판에서도 색 간격이 최대가 되게 */
export const regionColorClass = (regionId: number, boardSize: number): string => {
  const spread = Math.floor((regionId * REGION_COLORS.length) / Math.max(boardSize, 1));
  return REGION_COLORS[spread % REGION_COLORS.length] ?? '';
};
