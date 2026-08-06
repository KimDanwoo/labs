import {
  BIG_BOARD_SIZE,
  BIG_STAGE_STEP,
  FREE_STAR_FROM_SIZE,
  GENERATION_MAX_ATTEMPTS,
  PUZZLE_DIFFICULTY,
  RANDOM_SIZE_MAX,
  RANDOM_SIZE_MIN,
} from '@entities/stardoku/model/constants';
import { solveByLogic } from '@entities/stardoku/model/solver';
import { PuzzleDifficulty, RegionGrid, Rng, StardokuPuzzle } from '@entities/stardoku/model/types';

export const boardSizeForStage = (stage: number, rng: Rng = Math.random): number => {
  if (stage % BIG_STAGE_STEP === 0) return BIG_BOARD_SIZE;
  return RANDOM_SIZE_MIN + Math.floor(rng() * (RANDOM_SIZE_MAX - RANDOM_SIZE_MIN + 1));
};

const shuffle = <T>(items: T[], rng: Rng): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = items[i];
    const b = items[j];
    if (a !== undefined && b !== undefined) {
      items[i] = b;
      items[j] = a;
    }
  }
  return items;
};

/** 유효한 별 배치: 행별 열 순열 + 인접 행 열 차 ≥ 2 (대각 인접 배제) */
export const generateStarPlacement = (size: number, rng: Rng): number[] | null => {
  const cols: number[] = [];
  const used = new Set<number>();

  const backtrack = (row: number): boolean => {
    if (row === size) return true;
    const prevCol = cols[row - 1];
    for (const col of shuffle([...Array(size).keys()], rng)) {
      if (used.has(col)) continue;
      if (prevCol !== undefined && Math.abs(prevCol - col) < 2) continue;
      cols[row] = col;
      used.add(col);
      if (backtrack(row + 1)) return true;
      cols.length = row;
      used.delete(col);
    }
    return false;
  };

  return backtrack(0) ? cols : null;
};

const ORTHOGONAL: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * 별 칸을 씨앗으로 랜덤 flood-fill.
 * singletonCount만큼의 구역은 1칸(공짜 별 엔트리)으로 동결하고,
 * 나머지는 1페이즈에서 1회씩 확장해 최소 2칸을 구조적으로 보장한 뒤
 * 2페이즈에서 크기³ 비례(rich-get-richer)로 성장시켜 "큰 구역 소수 + 작은 구역 다수" 편차를 만든다 —
 * 작은/한 줄 구역이 제약을 강하게 걸어 유일해 확률이 크게 올라간다.
 */
export const growRegions = (size: number, stars: number[], rng: Rng, singletonCount = 0): RegionGrid | null => {
  const regions: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  const counts = Array<number>(size).fill(1);
  stars.forEach((col, row) => {
    const rowArr = regions[row];
    if (rowArr) rowArr[col] = row;
  });

  const dead = new Set<number>();
  const frozenSingletons = new Set<number>(shuffle([...Array(size).keys()], rng).slice(0, singletonCount));
  frozenSingletons.forEach((id) => dead.add(id));
  let remaining = size * size - size;

  const neighborsOf = (regionId: number): Array<[number, number]> => {
    const options: Array<[number, number]> = [];
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++) {
        if (regions[row]?.[col] !== regionId) continue;
        for (const [dr, dc] of ORTHOGONAL) {
          const nr = row + dr;
          const nc = col + dc;
          if (regions[nr]?.[nc] === -1) options.push([nr, nc]);
        }
      }
    return options;
  };

  const pickWeighted = (): number | null => {
    let total = 0;
    const weights: number[] = [];
    for (let id = 0; id < size; id++) {
      const count = counts[id] ?? 1;
      const weight = dead.has(id) ? 0 : count ** 3;
      weights.push(weight);
      total += weight;
    }
    if (total === 0) return null;
    let ticket = rng() * total;
    for (let id = 0; id < size; id++) {
      ticket -= weights[id] ?? 0;
      if (ticket <= 0) return id;
    }
    return weights.length - 1;
  };

  // 1페이즈: 동결 구역을 뺀 모든 구역을 랜덤 순서로 1회씩 확장 — 최소 2칸 보장
  for (const id of shuffle([...Array(size).keys()], rng)) {
    if (frozenSingletons.has(id)) continue;
    const options = neighborsOf(id);
    const pick = options[Math.floor(rng() * options.length)];
    if (!pick) return null; // 씨앗이 포위된 드문 경우 — 재시도
    const [row, col] = pick;
    const rowArr = regions[row];
    if (rowArr) rowArr[col] = id;
    counts[id] = (counts[id] ?? 1) + 1;
    remaining--;
  }

  // 2페이즈: 크기 가중 성장
  while (remaining > 0) {
    const id = pickWeighted();
    if (id === null) {
      // 전 구역 확장 불가 → 남은 칸을 인접 구역에 강제 편입
      for (let row = 0; row < size; row++)
        for (let col = 0; col < size; col++) {
          if (regions[row]?.[col] !== -1) continue;
          for (const [dr, dc] of ORTHOGONAL) {
            const neighborId = regions[row + dr]?.[col + dc];
            if (neighborId !== undefined && neighborId !== -1) {
              const rowArr = regions[row];
              if (rowArr) rowArr[col] = neighborId;
              remaining--;
              break;
            }
          }
        }
      return remaining === 0 ? regions : null;
    }

    const options = neighborsOf(id);
    if (options.length === 0) {
      dead.add(id);
      continue;
    }

    const pick = options[Math.floor(rng() * options.length)];
    if (!pick) return null;
    const [row, col] = pick;
    const rowArr = regions[row];
    if (rowArr) rowArr[col] = id;
    counts[id] = (counts[id] ?? 1) + 1;
    remaining--;
  }

  return regions;
};

const countSingletonRegions = (regions: RegionGrid): number => {
  const size = regions.length;
  const counts = Array<number>(size).fill(0);
  for (const row of regions) for (const id of row) counts[id] = (counts[id] ?? 0) + 1;
  return counts.filter((count) => count === 1).length;
};

/**
 * 크기별 난이도 밴드: EASY(T1 연쇄 자동 진행)는 전부 폐기.
 * 소형(≤6)은 MEDIUM만(작은 판에 T3 가정까지는 과함), 대형(≥7)은 MEDIUM·HARD 허용.
 */
const isAcceptableDifficulty = (size: number, difficulty: PuzzleDifficulty): boolean => {
  if (difficulty === PUZZLE_DIFFICULTY.MEDIUM) return true;
  return difficulty === PUZZLE_DIFFICULTY.HARD && size >= FREE_STAR_FROM_SIZE;
};

/**
 * 퍼즐 생성: 별 배치 → 구역 성장 → 논리 완주 검증(= 유일해·노게싱 보장) → 난이도 밴드 필터.
 * 크기별 엔트리 정책 — 6 이하: 1칸 구역 금지(시시해짐) / 7 이상: 1칸 구역 정확히 1개(공짜 별 시작점 없이는 못 푼다).
 */
export const generatePuzzle = (size: number, rng: Rng = Math.random): StardokuPuzzle => {
  const singletonCount = size >= FREE_STAR_FROM_SIZE ? 1 : 0;

  for (let attempt = 0; attempt < GENERATION_MAX_ATTEMPTS; attempt++) {
    const solution = generateStarPlacement(size, rng);
    if (!solution) continue;
    const regions = growRegions(size, solution, rng, singletonCount);
    if (!regions) continue;
    if (countSingletonRegions(regions) !== singletonCount) continue; // 강제 편입이 동결 구역을 키운 예외 케이스

    const result = solveByLogic(regions);
    if (!result.solved) continue;
    if (!isAcceptableDifficulty(size, result.difficulty)) continue;

    return { size, regions, solution };
  }

  throw new Error(`stardoku: ${size}×${size} 퍼즐 생성 실패 (${GENERATION_MAX_ATTEMPTS}회 시도)`);
};
