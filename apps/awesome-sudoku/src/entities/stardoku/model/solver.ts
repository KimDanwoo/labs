import { PUZZLE_DIFFICULTY } from '@entities/stardoku/model/constants';
import type { CellPosition, PuzzleDifficulty, RegionGrid } from '@entities/stardoku/model/types';

export const LOGIC_RULE = {
  REGION_SINGLE: 'region-single',
  ROW_SINGLE: 'row-single',
  COL_SINGLE: 'col-single',
} as const;

type LogicRule = (typeof LOGIC_RULE)[keyof typeof LOGIC_RULE];

interface LogicSolveResult {
  solved: boolean;
  rules: LogicRule[];
  stars: CellPosition[];
  /** 완주에 쓴 최고 기법 티어 — T1만: easy / T2 소거 필요: medium / T3 가정 필요: hard */
  difficulty: PuzzleDifficulty;
  /** T2(줄↔구역 소거)가 필요했던 라운드 수 — 최고 티어만으로는 안 잡히는 "얼마나 자주"를 잰다 */
  t2Rounds: number;
  /** T3(한 수 앞 모순)가 필요했던 라운드 수 */
  t3Rounds: number;
}

export const regionAt = (regions: RegionGrid, row: number, col: number): number => regions[row]?.[col] ?? -1;

const isAdjacent = (a: CellPosition, b: CellPosition): boolean =>
  Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;

/**
 * 사람이 쓰는 기법만으로 완주 시도. 완주(solved) = 강제 수순만으로 풀림 = 유일해 + 노게싱 보장.
 * 배치: (a) 구역 후보 1개 → 별  (b) 행/열 후보 1개 → 별
 * 소거: (c) 구역 후보가 한 행/열에 갇힘 → 그 줄의 타 구역 칸 소거
 *       (d) 행/열 후보가 전부 한 구역 → 그 구역 별은 그 줄에 → 구역의 줄 밖 후보 소거
 *       (e) 한 수 앞 모순: 이 칸에 별을 두면 어떤 미완 행/열/구역의 후보가 사라짐 → 이 칸 소거
 */
export const solveByLogic = (regions: RegionGrid): LogicSolveResult => {
  const size = regions.length;
  const candidates: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(true));
  const stars: CellPosition[] = [];
  const rules: LogicRule[] = [];

  const isCandidate = (row: number, col: number): boolean => candidates[row]?.[col] ?? false;
  const removeCandidate = (row: number, col: number): boolean => {
    const rowArr = candidates[row];
    if (!rowArr || !rowArr[col]) return false;
    rowArr[col] = false;
    return true;
  };

  const placeStar = (star: CellPosition, rule: LogicRule): void => {
    stars.push(star);
    rules.push(rule);
    const regionId = regionAt(regions, star.row, star.col);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const sameLine = row === star.row || col === star.col;
        const sameRegion = regionAt(regions, row, col) === regionId;
        if (sameLine || sameRegion || isAdjacent({ row, col }, star)) removeCandidate(row, col);
      }
    }
  };

  const candidatesOfRegion = (regionId: number): CellPosition[] => {
    const cells: CellPosition[] = [];
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++)
        if (regionAt(regions, row, col) === regionId && isCandidate(row, col)) cells.push({ row, col });
    return cells;
  };

  const starredRegions = (): Set<number> => new Set(stars.map((s) => regionAt(regions, s.row, s.col)));
  const starredRows = (): Set<number> => new Set(stars.map((s) => s.row));
  const starredCols = (): Set<number> => new Set(stars.map((s) => s.col));

  let t2Rounds = 0;
  let t3Rounds = 0;
  const currentDifficulty = (): PuzzleDifficulty => {
    if (t3Rounds > 0) return PUZZLE_DIFFICULTY.HARD;
    if (t2Rounds > 0) return PUZZLE_DIFFICULTY.MEDIUM;
    return PUZZLE_DIFFICULTY.EASY;
  };
  const fail = (): LogicSolveResult => ({
    solved: false,
    rules,
    stars,
    difficulty: currentDifficulty(),
    t2Rounds,
    t3Rounds,
  });

  let progress = true;
  while (progress && stars.length < size) {
    progress = false;
    let usedT2 = false;
    let usedT3 = false;
    const doneRegions = starredRegions();
    const doneRows = starredRows();
    const doneCols = starredCols();

    // (a) 구역 후보 1개
    for (let regionId = 0; regionId < size && !progress; regionId++) {
      if (doneRegions.has(regionId)) continue;
      const cells = candidatesOfRegion(regionId);
      if (cells.length === 0) return fail();
      const only = cells[0];
      if (cells.length === 1 && only) {
        placeStar(only, LOGIC_RULE.REGION_SINGLE);
        progress = true;
      }
    }
    if (progress) continue;

    // (b) 행/열 후보 1개
    for (let row = 0; row < size && !progress; row++) {
      if (doneRows.has(row)) continue;
      const cells: CellPosition[] = [];
      for (let col = 0; col < size; col++) if (isCandidate(row, col)) cells.push({ row, col });
      if (cells.length === 0) return fail();
      const only = cells[0];
      if (cells.length === 1 && only) {
        placeStar(only, LOGIC_RULE.ROW_SINGLE);
        progress = true;
      }
    }
    for (let col = 0; col < size && !progress; col++) {
      if (doneCols.has(col)) continue;
      const cells: CellPosition[] = [];
      for (let row = 0; row < size; row++) if (isCandidate(row, col)) cells.push({ row, col });
      if (cells.length === 0) return fail();
      const only = cells[0];
      if (cells.length === 1 && only) {
        placeStar(only, LOGIC_RULE.COL_SINGLE);
        progress = true;
      }
    }
    if (progress) continue;

    // (c) 구역 후보가 한 행/열에 갇힘 → 그 줄의 타 구역 후보 소거
    for (let regionId = 0; regionId < size; regionId++) {
      if (doneRegions.has(regionId)) continue;
      const cells = candidatesOfRegion(regionId);
      const rows = new Set(cells.map((c) => c.row));
      const cols = new Set(cells.map((c) => c.col));
      if (rows.size === 1) {
        const [row] = rows;
        if (row !== undefined)
          for (let col = 0; col < size; col++)
            if (regionAt(regions, row, col) !== regionId && removeCandidate(row, col)) {
              progress = true;
              usedT2 = true;
            }
      }
      if (cols.size === 1) {
        const [col] = cols;
        if (col !== undefined)
          for (let row = 0; row < size; row++)
            if (regionAt(regions, row, col) !== regionId && removeCandidate(row, col)) {
              progress = true;
              usedT2 = true;
            }
      }
    }

    // (d) 행/열 후보가 전부 한 구역 → 그 구역 별은 그 줄에 확정 → 구역의 줄 밖 후보 소거
    for (let row = 0; row < size; row++) {
      if (doneRows.has(row)) continue;
      const regionIds = new Set<number>();
      for (let col = 0; col < size; col++) if (isCandidate(row, col)) regionIds.add(regionAt(regions, row, col));
      if (regionIds.size !== 1) continue;
      const [regionId] = regionIds;
      if (regionId === undefined) continue;
      for (const cell of candidatesOfRegion(regionId))
        if (cell.row !== row && removeCandidate(cell.row, cell.col)) {
          progress = true;
          usedT2 = true;
        }
    }
    for (let col = 0; col < size; col++) {
      if (doneCols.has(col)) continue;
      const regionIds = new Set<number>();
      for (let row = 0; row < size; row++) if (isCandidate(row, col)) regionIds.add(regionAt(regions, row, col));
      if (regionIds.size !== 1) continue;
      const [regionId] = regionIds;
      if (regionId === undefined) continue;
      for (const cell of candidatesOfRegion(regionId))
        if (cell.col !== col && removeCandidate(cell.row, cell.col)) {
          progress = true;
          usedT2 = true;
        }
    }
    if (progress) {
      if (usedT2) t2Rounds++;
      continue;
    }

    // (e) 한 수 앞 모순 확인: 별을 뒀다고 가정했을 때 미완 행/열/구역의 후보가 전멸하면 그 칸 소거
    const wouldContradict = (star: CellPosition): boolean => {
      const starRegion = regionAt(regions, star.row, star.col);
      const remains = (row: number, col: number): boolean =>
        isCandidate(row, col) &&
        row !== star.row &&
        col !== star.col &&
        regionAt(regions, row, col) !== starRegion &&
        !isAdjacent({ row, col }, star);

      for (let row = 0; row < size; row++) {
        if (row === star.row || doneRows.has(row)) continue;
        let alive = false;
        for (let col = 0; col < size && !alive; col++) alive = remains(row, col);
        if (!alive) return true;
      }
      for (let col = 0; col < size; col++) {
        if (col === star.col || doneCols.has(col)) continue;
        let alive = false;
        for (let row = 0; row < size && !alive; row++) alive = remains(row, col);
        if (!alive) return true;
      }
      for (let regionId = 0; regionId < size; regionId++) {
        if (regionId === starRegion || doneRegions.has(regionId)) continue;
        const alive = candidatesOfRegion(regionId).some((cell) => remains(cell.row, cell.col));
        if (!alive) return true;
      }
      return false;
    };

    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++)
        if (isCandidate(row, col) && wouldContradict({ row, col }) && removeCandidate(row, col)) {
          progress = true;
          usedT3 = true;
        }
    if (usedT3) t3Rounds++;
  }

  return { solved: stars.length === size, rules, stars, difficulty: currentDifficulty(), t2Rounds, t3Rounds };
};

/** 브루트포스 해 카운터 (2개 발견 시 조기 종료) — 논리 솔버 이중 검증용 */
export const countSolutions = (regions: RegionGrid): number => {
  const size = regions.length;
  let count = 0;
  const cols: number[] = [];
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();

  const backtrack = (row: number): void => {
    if (count >= 2) return;
    if (row === size) {
      count++;
      return;
    }
    for (let col = 0; col < size; col++) {
      const prevCol = cols[row - 1];
      if (usedCols.has(col) || usedRegions.has(regionAt(regions, row, col))) continue;
      if (prevCol !== undefined && Math.abs(prevCol - col) < 2) continue;
      cols[row] = col;
      usedCols.add(col);
      usedRegions.add(regionAt(regions, row, col));
      backtrack(row + 1);
      cols.length = row;
      usedCols.delete(col);
      usedRegions.delete(regionAt(regions, row, col));
    }
  };

  backtrack(0);
  return count;
};
