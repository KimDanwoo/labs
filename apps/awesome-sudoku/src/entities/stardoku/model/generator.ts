import {
  BIG_BOARD_SIZE,
  BIG_STAGE_STEP,
  DEFAULT_REGION_GROWTH_EXPONENT,
  GENERATION_MAX_ATTEMPTS,
  MIN_LOGIC_DEPTH_BY_STAGE,
  REGION_GROWTH_EXPONENT_BY_SIZE,
  SIZE_BY_STAGE,
  logicDepthScore,
} from '@entities/stardoku/model/constants';
import { solveByLogic } from '@entities/stardoku/model/solver';
import type { RegionGrid, Rng, StardokuPuzzle } from '@entities/stardoku/model/types';

const atStage = <T>(table: readonly T[], stage: number): T => {
  const value = table[Math.min(Math.max(stage, 1), table.length) - 1];
  if (value === undefined) throw new Error('stardoku: 빈 스테이지 테이블');
  return value;
};

/** 스테이지에 따라 단조 증가 — 5의 배수는 대형판 이벤트 */
export const boardSizeForStage = (stage: number): number =>
  stage % BIG_STAGE_STEP === 0 ? BIG_BOARD_SIZE : atStage(SIZE_BY_STAGE, stage);

export const minLogicDepthForStage = (stage: number): number => atStage(MIN_LOGIC_DEPTH_BY_STAGE, stage);

export const growthExponentForSize = (size: number): number =>
  REGION_GROWTH_EXPONENT_BY_SIZE[size] ?? DEFAULT_REGION_GROWTH_EXPONENT;

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
const generateStarPlacement = (size: number, rng: Rng): number[] | null => {
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
 * 1페이즈에서 모든 구역을 1회씩 확장해 최소 2칸을 구조적으로 보장한 뒤
 * 2페이즈에서 크기^지수 비례(rich-get-richer)로 성장시켜 "큰 구역 소수 + 작은 구역 다수" 편차를 만든다 —
 * 작은/한 줄 구역이 제약을 강하게 걸어 유일해 확률이 크게 올라간다.
 * 지수는 크기별로 다르다(REGION_GROWTH_EXPONENT_BY_SIZE) — 낮출수록 크기가 고르게 퍼져 판이 다채로워지지만
 * 유일해가 희소해져 생성이 느려지므로, 생성 예산 안에서 가장 낮은 값을 실측으로 잡았다.
 *
 * 편차는 취향이 아니라 유일해의 필요조건이다. 10×10에서 모든 구역에 하한을 걸고 6000판을 뽑아본 결과
 * 유일해 비율은 하한 2칸 8.17% → 3칸 0.10% → 4칸 0.00%. 2칸짜리 조각이 만드는 강한 제약이 없으면
 * 1별-1구역 규칙에서 해가 하나로 좁혀지지 않는다. 균등 구역으로 시작해 경계를 옮기는 국소 탐색도
 * 시도했으나 10×10 성공률 0~5%·1.2초로 실패했다.
 * 판이 한 구역에 잠식돼 보이는 건 이 대가이고, 큰 구역에 무채색을 주는 색 배정(regionColorIndexes)으로 상쇄한다.
 */
export const growRegions = (
  size: number,
  stars: number[],
  rng: Rng,
  growthExponent = DEFAULT_REGION_GROWTH_EXPONENT,
): RegionGrid | null => {
  const regions: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  const counts = Array<number>(size).fill(1);
  stars.forEach((col, row) => {
    const rowArr = regions[row];
    if (rowArr) rowArr[col] = row;
  });

  const dead = new Set<number>();
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
      const weight = dead.has(id) ? 0 : count ** growthExponent;
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

  // 1페이즈: 모든 구역을 랜덤 순서로 1회씩 확장 — 최소 2칸 보장
  for (const id of shuffle([...Array(size).keys()], rng)) {
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

const countRegionCells = (regions: RegionGrid): number[] => {
  const counts = Array<number>(regions.length).fill(0);
  for (const row of regions) for (const id of row) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
};

const hasSingletonRegion = (regions: RegionGrid): boolean => countRegionCells(regions).some((count) => count === 1);

const tryGenerate = (size: number, minLogicDepth: number, rng: Rng): StardokuPuzzle | null => {
  for (let attempt = 0; attempt < GENERATION_MAX_ATTEMPTS; attempt++) {
    const solution = generateStarPlacement(size, rng);
    if (!solution) continue;
    const regions = growRegions(size, solution, rng, growthExponentForSize(size));
    if (!regions) continue;
    if (hasSingletonRegion(regions)) continue;

    const result = solveByLogic(regions);
    if (!result.solved) continue; // 논리 완주 실패 = 유일해·노게싱 미보장
    if (logicDepthScore(result.t2Rounds, result.t3Rounds) < minLogicDepth) continue;

    return { size, regions, solution };
  }
  return null;
};

/**
 * 퍼즐 생성: 별 배치 → 구역 성장 → 논리 완주 검증(= 유일해·노게싱 보장) → 논리깊이 게이트.
 * 요구 깊이를 못 채우면 1씩 낮춰 재시도한다 — 깊은 판은 희소해서(9×9 깊이 5는 0.5%)
 * 한 게이트에 매달리면 생성이 실패할 수 있다. 쉬운 판을 주는 게 판을 못 주는 것보다 낫다.
 */
export const generatePuzzle = (size: number, minLogicDepth = 0, rng: Rng = Math.random): StardokuPuzzle => {
  for (let required = minLogicDepth; required >= 0; required--) {
    const puzzle = tryGenerate(size, required, rng);
    if (puzzle) return puzzle;
  }

  throw new Error(`stardoku: ${size}×${size} 퍼즐 생성 실패 (게이트당 ${GENERATION_MAX_ATTEMPTS}회 시도)`);
};
