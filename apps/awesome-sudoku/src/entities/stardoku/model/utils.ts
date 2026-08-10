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

/**
 * 클리어 판정 — 별이 size개이고 규칙 위반이 하나도 없으면 정답이다.
 * size개 별이 행·열·구역·인접 제약을 모두 만족하면 비둘기집 원리로 유일해와 일치하므로 solution 대조가 필요 없다.
 * 파생 atom(화면 표시)과 정산 로직(커밋 전 marks 평가) 양쪽이 이 함수만 본다 — 조건이 갈라지면 안 된다.
 */
export const isPuzzleSolved = (marks: MarkGrid, size: number, regions: RegionGrid): boolean =>
  countStars(marks) === size && violatingStarKeys(marks, regions).size === 0;

/**
 * 구역 id → 팔레트 인덱스. **넓은 구역일수록 앞쪽(저채도)** 을 받는다.
 * 생성기가 판의 절반 이상을 차지하는 구역을 구조적으로 만들기 때문에(유일해 조건 — generator.ts),
 * 면적에 비례해 채도를 주면 판 전체가 그 색으로 물든다. 면적-채도를 반비례시켜 상쇄한다.
 * 보드 크기가 팔레트보다 작으면 남는 색을 건너뛰며 균등 분산해 색 간격을 최대로 벌린다.
 */
export const regionColorIndexes = (regions: RegionGrid): number[] => {
  const size = regions.length;
  const counts = Array<number>(size).fill(0);
  for (const row of regions) for (const id of row) counts[id] = (counts[id] ?? 0) + 1;

  const indexes = Array<number>(size).fill(0);
  counts
    .map((count, id) => ({ count, id }))
    .sort((a, b) => b.count - a.count || a.id - b.id)
    .forEach(({ id }, rank) => {
      indexes[id] = Math.floor((rank * REGION_COLORS.length) / Math.max(size, 1)) % REGION_COLORS.length;
    });
  return indexes;
};

export const regionColorClass = (colorIndex: number): string => REGION_COLORS[colorIndex] ?? '';
