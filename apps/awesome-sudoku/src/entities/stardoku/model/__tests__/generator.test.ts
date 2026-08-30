import { createRng, toRegions } from '@entities/stardoku/model/__tests__/fixtures';
import {
  BIG_BOARD_SIZE,
  DEFAULT_REGION_GROWTH_EXPONENT,
  MIN_REGION_SIZE,
  PUZZLE_DIFFICULTY,
  logicDepthScore,
} from '@entities/stardoku/model/constants';
import {
  boardSizeForStage,
  generatePuzzle,
  growthExponentForSize,
  minLogicDepthForStage,
} from '@entities/stardoku/model/generator';
import { countSolutions, solveByLogic } from '@entities/stardoku/model/solver';
import type { StardokuPuzzle } from '@entities/stardoku/model/types';
import { regionColorIndexes } from '@entities/stardoku/model/utils';
import { describe, expect, it } from 'vitest';

const expectValidPlacement = ({ size, solution, regions }: StardokuPuzzle): void => {
  // 행·열 1개씩 (순열)
  expect(solution).toHaveLength(size);
  expect(new Set(solution).size).toBe(size);
  // 대각 인접 배제
  for (let row = 1; row < size; row++) {
    const prev = solution[row - 1];
    const curr = solution[row];
    expect(prev).toBeDefined();
    expect(curr).toBeDefined();
    if (prev !== undefined && curr !== undefined) expect(Math.abs(prev - curr)).toBeGreaterThanOrEqual(2);
  }
  // 구역마다 별 1개
  const starRegions = solution.map((col, row) => regions[row]?.[col]);
  expect(new Set(starRegions).size).toBe(size);
};

const expectConnectedRegions = ({ size, regions }: StardokuPuzzle): void => {
  for (let regionId = 0; regionId < size; regionId++) {
    const cells: Array<[number, number]> = [];
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++) if (regions[row]?.[col] === regionId) cells.push([row, col]);
    expect(cells.length).toBeGreaterThan(0);

    // BFS로 연결성 확인
    const first = cells[0];
    if (!first) continue;
    const visited = new Set<string>([first.join(',')]);
    const queue: Array<[number, number]> = [first];
    while (queue.length > 0) {
      const cell = queue.shift();
      if (!cell) break;
      const [row, col] = cell;
      for (const [nr, nc] of [
        [row + 1, col],
        [row - 1, col],
        [row, col + 1],
        [row, col - 1],
      ]) {
        const key = `${nr},${nc}`;
        if (nr === undefined || nc === undefined) continue;
        if (regions[nr]?.[nc] === regionId && !visited.has(key)) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
    expect(visited.size).toBe(cells.length);
  }
};

describe('boardSizeForStage', () => {
  it('5의 배수 스테이지는 대형판', () => {
    for (const stage of [5, 10, 15, 100]) {
      expect(boardSizeForStage(stage)).toBe(BIG_BOARD_SIZE);
    }
  });

  it('일반 스테이지 크기는 스테이지에 따라 단조 증가한다 (같은 스테이지는 항상 같은 크기)', () => {
    const regularStages = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 23];
    const sizes = regularStages.map((stage) => boardSizeForStage(stage));

    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(Math.min(...sizes)).toBe(7);
    expect(Math.max(...sizes)).toBeLessThan(BIG_BOARD_SIZE);
    expect(boardSizeForStage(7)).toBe(boardSizeForStage(7));
  });
});

describe('minLogicDepthForStage', () => {
  it('스테이지가 오를수록 요구 논리깊이가 낮아지지 않는다', () => {
    const depths = Array.from({ length: 30 }, (_, i) => minLogicDepthForStage(i + 1));
    expect(depths).toEqual([...depths].sort((a, b) => a - b));
  });

  it('후반 스테이지는 T3(한 수 앞 모순)를 강제한다 — 깊이 4 = T3 최소 1회', () => {
    expect(minLogicDepthForStage(1)).toBeLessThan(4);
    expect(minLogicDepthForStage(20)).toBeGreaterThanOrEqual(4);
  });
});

describe('generatePuzzle', () => {
  it.each([7, 8, 9, 10])('크기 %d: 제약 충족·구역 연결·유일해 퍼즐을 생성한다', (size) => {
    const puzzle = generatePuzzle(size, 0, createRng(size * 1000 + 7));

    expect(puzzle.size).toBe(size);
    expect(puzzle.regions).toHaveLength(size);
    expectValidPlacement(puzzle);
    expectConnectedRegions(puzzle);
    expect(countSolutions(puzzle.regions)).toBe(1);

    // 1칸 구역(공짜 별) 금지 — 있으면 상당수 판이 T1 연쇄만으로 풀린다
    const regionSizes = Array<number>(size).fill(0);
    for (const row of puzzle.regions) for (const id of row) regionSizes[id] = (regionSizes[id] ?? 0) + 1;
    expect(Math.min(...regionSizes)).toBeGreaterThanOrEqual(MIN_REGION_SIZE);

    // EASY(T1 연쇄만으로 자동 진행)는 어떤 게이트에서도 나오면 안 된다
    expect(solveByLogic(puzzle.regions).difficulty).not.toBe(PUZZLE_DIFFICULTY.EASY);
  });

  it.each([7, 8, 9, 10])('크기 %d: 요구 논리깊이를 만족하는 판만 낸다', (size) => {
    const minDepth = 4; // T3 최소 1회
    const puzzle = generatePuzzle(size, minDepth, createRng(size * 31 + 3));
    const { t2Rounds, t3Rounds, solved } = solveByLogic(puzzle.regions);

    expect(solved).toBe(true);
    expect(logicDepthScore(t2Rounds, t3Rounds)).toBeGreaterThanOrEqual(minDepth);
    expect(t3Rounds).toBeGreaterThanOrEqual(1);
  });

  it('같은 시드는 같은 퍼즐을 만든다 (rng 주입 결정성)', () => {
    const a = generatePuzzle(7, 2, createRng(123));
    const b = generatePuzzle(7, 2, createRng(123));
    expect(a).toEqual(b);
  });
});

describe('regionColorIndexes', () => {
  it('넓은 구역일수록 팔레트 앞쪽(저채도)을 받는다 — 판을 뒤덮는 구역이 무채색이어야 조용하다', () => {
    // 구역 0이 대부분, 2가 가장 작다
    const regions = toRegions(['AAAA', 'AAAA', 'AABB', 'ACBB']);
    const indexes = regionColorIndexes(regions);

    const areas = [0, 1, 2, 3].map((id) => regions.flat().filter((v) => v === id).length);
    const biggest = areas.indexOf(Math.max(...areas));
    const smallest = areas.indexOf(Math.min(...areas));

    expect(indexes[biggest]).toBe(0);
    expect(indexes[smallest]).toBeGreaterThan(indexes[biggest] ?? 0);
  });

  it('생성된 판에서도 최대 구역이 항상 팔레트 0번을 받는다', () => {
    for (const size of [7, 8, 10]) {
      const { regions } = generatePuzzle(size, 0, createRng(size * 17 + 5));
      const counts = Array<number>(size).fill(0);
      for (const row of regions) for (const id of row) counts[id] = (counts[id] ?? 0) + 1;
      const biggest = counts.indexOf(Math.max(...counts));

      expect(regionColorIndexes(regions)[biggest]).toBe(0);
    }
  });
});

describe('구역 크기 다양성', () => {
  const regionSizesOf = (regions: number[][]): number[] => {
    const counts = Array<number>(regions.length).fill(0);
    for (const row of regions) for (const id of row) counts[id] = (counts[id] ?? 0) + 1;
    return counts.sort((a, b) => a - b);
  };

  // 지수를 3(기본값)으로 되돌리면 7×7 기준 3칸이하 4.8개·중앙 2.5칸으로 무너진다
  it('7×7은 2~3칸 조각이 절반 미만이고 중앙값이 3칸을 넘는다 — "2개 1자"만 늘어서면 너무 쉽다', () => {
    const samples = Array.from({ length: 12 }, (_, i) => generatePuzzle(7, 2, createRng(i * 101 + 7)));
    const tinyCounts = samples.map((p) => regionSizesOf(p.regions).filter((c) => c <= 3).length);
    const medians = samples.map((p) => regionSizesOf(p.regions)[3] ?? 0);

    const avgTiny = tinyCounts.reduce((s, v) => s + v, 0) / samples.length;
    const avgMedian = medians.reduce((s, v) => s + v, 0) / samples.length;

    expect(avgTiny).toBeLessThan(4);
    expect(avgMedian).toBeGreaterThan(3.5);
  });

  it('크기별 성장 지수는 생성 예산에 맞춰 낮춰져 있다', () => {
    for (const size of [7, 8, 9]) {
      expect(growthExponentForSize(size)).toBeLessThan(DEFAULT_REGION_GROWTH_EXPONENT);
    }
    // 판이 클수록 조각을 못 줄인다 — 지수를 더 낮추면 생성이 예산을 넘는다
    expect(growthExponentForSize(7)).toBeLessThan(growthExponentForSize(10));
  });
});
