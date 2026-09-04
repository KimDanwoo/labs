import type { Grid, GridPosition } from '@entities/board/model/types';
import { TECHNIQUE } from '@entities/game/model/constants';
import type { KillerCage } from '@entities/game/model/types';
import { describe, expect, it } from 'vitest';
import { generateKillerCages } from '../generator';
import { countSolutions, generateRandomSolution, gradePuzzle, hasUniqueSolution, solveLogically } from '../solver';
import { isValidSolution } from '../validator';

const parse = (rows: string[]): Grid => rows.map((row) => [...row].map((ch) => (ch === '.' ? 0 : Number(ch))));

/** 싱글만으로 풀리는 고전 예제 (Project Euler #96 1번) */
const EASY_PUZZLE = parse([
  '..3.2.6..',
  '9..3.5..1',
  '..18.64..',
  '..81.29..',
  '7.......8',
  '..67.82..',
  '..26.95..',
  '8..2.3..9',
  '..5.1.3..',
]);

/** AI Escargot — 사람 기법(싱글·락드·서브셋)으로는 완주가 안 되는 판 */
const ESCARGOT = parse([
  '1....7.9.',
  '.3..2...8',
  '..96..5..',
  '..53..9..',
  '.1..8...2',
  '6....4...',
  '3......1.',
  '.4......7',
  '..7...3..',
]);

const SOLUTION: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const emptyGrid = (): Grid => Array.from({ length: 9 }, () => Array<number>(9).fill(0));

describe('countSolutions / hasUniqueSolution', () => {
  it('정상 퍼즐과 완성 그리드는 해가 하나다', () => {
    expect(countSolutions(EASY_PUZZLE, 2)).toBe(1);
    expect(countSolutions(ESCARGOT, 2)).toBe(1);
    expect(hasUniqueSolution(SOLUTION)).toBe(true);
  });

  it('빈 그리드는 limit까지 센다', () => {
    expect(countSolutions(emptyGrid(), 2)).toBe(2);
    expect(countSolutions(emptyGrid(), 5)).toBe(5);
  });

  it('노드 예산을 넘기면 유일하지 않은 것으로 간주한다', () => {
    expect(countSolutions(EASY_PUZZLE, 2, undefined, 1)).toBe(2);
    expect(hasUniqueSolution(EASY_PUZZLE, undefined, 1)).toBe(false);
  });

  it('힌트 없이 케이지만으로도 유일해를 결정한다 — 1칸 케이지는 값을 확정한다', () => {
    const cages: KillerCage[] = SOLUTION.flatMap((row, r) =>
      row.map((value, c) => ({ id: r * 9 + c + 1, cells: [[r, c] as GridPosition], sum: value })),
    );
    expect(countSolutions(emptyGrid(), 2, cages)).toBe(1);
  });

  it('케이지 합이 맞지 않으면 해가 없다', () => {
    const grid = SOLUTION.map((row) => [...row]);
    grid[0][0] = 0;
    grid[0][1] = 0;
    const cages: KillerCage[] = [
      {
        id: 1,
        cells: [
          [0, 0],
          [0, 1],
        ],
        sum: SOLUTION[0][0] + SOLUTION[0][1] + 1,
      },
    ];
    expect(countSolutions(grid, 2, cages)).toBe(0);
  });
});

describe('generateRandomSolution', () => {
  it('유효한 완성 그리드를 만든다', () => {
    expect(isValidSolution(generateRandomSolution())).toBe(true);
  });
});

describe('gradePuzzle', () => {
  it('완성 그리드와 싱글만 필요한 퍼즐은 SINGLE', () => {
    expect(gradePuzzle(SOLUTION)).toBe(TECHNIQUE.SINGLE);
    expect(gradePuzzle(EASY_PUZZLE)).toBe(TECHNIQUE.SINGLE);
  });

  it('사람 기법으로 완주가 안 되는 퍼즐은 GUESS', () => {
    expect(gradePuzzle(ESCARGOT)).toBe(TECHNIQUE.GUESS);
  });
});

describe('solveLogically 건전성', () => {
  const dig = (solution: Grid, holes: number): Grid => {
    const grid = solution.map((row) => [...row]);
    const cells = Array.from({ length: 81 }, (_, k) => k).sort(() => Math.random() - 0.5);
    for (const k of cells.slice(0, holes)) grid[Math.floor(k / 9)][k % 9] = 0;
    return grid;
  };

  it('놓은 값은 전부 정답과 같다 — 후보 제거가 정답을 지우면 여기서 걸린다', () => {
    for (let i = 0; i < 40; i++) {
      const solution = generateRandomSolution();
      const puzzle = dig(solution, 40 + Math.floor(Math.random() * 20));
      if (countSolutions(puzzle, 2) !== 1) continue;
      const { technique, grid } = solveLogically(puzzle);
      grid.forEach((row, r) => row.forEach((v, c) => v !== 0 && expect(v).toBe(solution[r][c])));
      if (technique !== TECHNIQUE.GUESS) expect(grid).toEqual(solution);
    }
  });
});

describe('킬러 해 개수 교차 검증', () => {
  /** 독립 구현: 클래식 해를 전부 열거한 뒤 케이지 규칙으로 걸러 센다 */
  const bruteForceKillerCount = (grid: Grid, cages: KillerCage[]): number => {
    const g = grid.map((row) => [...row]);
    const solutions: Grid[] = [];
    const canPlace = (r: number, c: number, v: number): boolean => {
      for (let i = 0; i < 9; i++) if (g[r][i] === v || g[i][c] === v) return false;
      const br = r - (r % 3);
      const bc = c - (c % 3);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[br + i][bc + j] === v) return false;
      return true;
    };
    const recurse = (pos: number): void => {
      if (pos === 81) {
        solutions.push(g.map((row) => [...row]));
        return;
      }
      const r = Math.floor(pos / 9);
      const c = pos % 9;
      if (g[r][c] !== 0) {
        recurse(pos + 1);
        return;
      }
      for (let v = 1; v <= 9; v++) {
        if (!canPlace(r, c, v)) continue;
        g[r][c] = v;
        recurse(pos + 1);
        g[r][c] = 0;
      }
    };
    recurse(0);
    const satisfiesCages = (s: Grid): boolean =>
      cages.every((cage) => {
        const values = cage.cells.map(([r, c]) => s[r][c]);
        return new Set(values).size === values.length && values.reduce((a, b) => a + b, 0) === cage.sum;
      });
    return solutions.filter(satisfiesCages).length;
  };

  it('무작위 부분 판에서 브루트포스와 같은 값을 낸다 (합을 고의로 깬 케이지 포함)', () => {
    for (let i = 0; i < 12; i++) {
      const solution = generateRandomSolution();
      const cages = generateKillerCages(solution, 4).map((cage) => ({ ...cage }));
      const grid = solution.map((row) => [...row]);
      const order = Array.from({ length: 81 }, (_, k) => k).sort(() => Math.random() - 0.5);
      for (const k of order.slice(0, 20 + (i % 8))) grid[Math.floor(k / 9)][k % 9] = 0;
      if (i % 4 === 0) cages[0].sum += 1;

      expect(countSolutions(grid, 1000, cages)).toBe(bruteForceKillerCount(grid, cages));
    }
  });

  it('주어진 칸만으로 닫힌 케이지의 합이 틀리면 해가 없다', () => {
    const grid = SOLUTION.map((row) => [...row]);
    grid[8][8] = 0;
    const cages: KillerCage[] = [{ id: 1, cells: [[0, 0]], sum: SOLUTION[0][0] + 1 }];
    expect(countSolutions(grid, 2, cages)).toBe(0);
  });
});
