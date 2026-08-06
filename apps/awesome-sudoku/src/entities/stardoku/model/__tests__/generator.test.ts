import {
  BIG_BOARD_SIZE,
  FREE_STAR_FROM_SIZE,
  MIN_REGION_SIZE,
  PUZZLE_DIFFICULTY,
  RANDOM_SIZE_MAX,
  RANDOM_SIZE_MIN,
} from '@entities/stardoku/model/constants';
import { boardSizeForStage, generatePuzzle } from '@entities/stardoku/model/generator';
import { countSolutions, solveByLogic } from '@entities/stardoku/model/solver';
import { Rng, StardokuPuzzle } from '@entities/stardoku/model/types';
import { describe, expect, it } from 'vitest';

const createRng = (seed: number): Rng => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
};

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
      expect(boardSizeForStage(stage, createRng(1))).toBe(BIG_BOARD_SIZE);
    }
  });

  it('일반 스테이지는 랜덤 범위 내 크기', () => {
    const rng = createRng(42);
    for (const stage of [1, 2, 3, 4, 6, 7, 11, 23]) {
      const size = boardSizeForStage(stage, rng);
      expect(size).toBeGreaterThanOrEqual(RANDOM_SIZE_MIN);
      expect(size).toBeLessThanOrEqual(RANDOM_SIZE_MAX);
    }
  });
});

describe('generatePuzzle', () => {
  it.each([5, 6, 7, 8, 9])('크기 %d: 제약 충족·구역 연결·유일해 퍼즐을 생성한다', (size) => {
    const puzzle = generatePuzzle(size, createRng(size * 1000 + 7));

    expect(puzzle.size).toBe(size);
    expect(puzzle.regions).toHaveLength(size);
    expectValidPlacement(puzzle);
    expectConnectedRegions(puzzle);
    expect(countSolutions(puzzle.regions)).toBe(1);

    // 크기별 엔트리 정책: 6 이하 — 1칸 구역 금지 / 7 이상 — 1칸 구역(공짜 별) 정확히 1개
    const regionSizes = Array<number>(size).fill(0);
    for (const row of puzzle.regions) for (const id of row) regionSizes[id] = (regionSizes[id] ?? 0) + 1;
    const singletonCount = regionSizes.filter((count) => count === 1).length;
    if (size >= FREE_STAR_FROM_SIZE) {
      expect(singletonCount).toBe(1);
    } else {
      expect(singletonCount).toBe(0);
      expect(Math.min(...regionSizes)).toBeGreaterThanOrEqual(MIN_REGION_SIZE);
    }

    // 난이도 밴드: easy(T1 연쇄) 폐기, 소형은 medium만, 대형은 medium·hard
    const { difficulty } = solveByLogic(puzzle.regions);
    if (size >= FREE_STAR_FROM_SIZE) {
      expect([PUZZLE_DIFFICULTY.MEDIUM, PUZZLE_DIFFICULTY.HARD]).toContain(difficulty);
    } else {
      expect(difficulty).toBe(PUZZLE_DIFFICULTY.MEDIUM);
    }
  });

  it('같은 시드는 같은 퍼즐을 만든다 (rng 주입 결정성)', () => {
    const a = generatePuzzle(6, createRng(123));
    const b = generatePuzzle(6, createRng(123));
    expect(a).toEqual(b);
  });
});
