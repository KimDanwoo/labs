import { SUDOKU_CELL_COUNT } from '@entities/board/model/constants';
import type { Grid, GridPosition, SudokuBoard } from '@entities/board/model/types';
import { CLASSIC_DIFFICULTY, GAME_LEVEL, KILLER_DIFFICULTY, TECHNIQUE } from '@entities/game/model/constants';
import type { Difficulty, KillerCage } from '@entities/game/model/types';
import { describe, expect, it } from 'vitest';
import { generateBoard, generateKillerBoard, generateKillerCages, generateSolution } from '../generator';
import { countSolutions, gradePuzzle } from '../solver';
import { isValidSolution } from '../validator';

const DIFFICULTIES = Object.values(GAME_LEVEL) as Difficulty[];

const toGrid = (board: SudokuBoard): Grid => board.map((row) => row.map((cell) => cell.value ?? 0));
const countClues = (board: SudokuBoard): number => board.flat().filter((cell) => cell.value !== null).length;

const isContiguous = (cells: GridPosition[]): boolean => {
  const keys = new Set(cells.map(([r, c]) => `${r}-${c}`));
  const seen = new Set<string>();
  const stack: GridPosition[] = [cells[0]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r}-${c}`;
    if (seen.has(key) || !keys.has(key)) continue;
    seen.add(key);
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return seen.size === cells.length;
};

const expectBoardMatchesPuzzle = (board: SudokuBoard, solution: Grid): void => {
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      expect(cell.isInitial).toBe(cell.value !== null);
      if (cell.value !== null) expect(cell.value).toBe(solution[r][c]);
      expect(cell.isConflict).toBe(false);
      expect(cell.notes).toEqual([]);
    }),
  );
};

describe('generateSolution', () => {
  it('유효한 완성 그리드를 만들고, 매번 다른 판을 준다', () => {
    const a = generateSolution();
    const b = generateSolution();
    expect(isValidSolution(a)).toBe(true);
    expect(isValidSolution(b)).toBe(true);
    expect(a).not.toEqual(b);
  });
});

describe('generateBoard (클래식)', () => {
  it.each(DIFFICULTIES)('%s: 정답의 부분집합이고 유일해다', (difficulty) => {
    const solution = generateSolution();
    const board = generateBoard(solution, difficulty);

    expectBoardMatchesPuzzle(board, solution);
    expect(countSolutions(toGrid(board), 2)).toBe(1);
  });

  it.each([GAME_LEVEL.EASY, GAME_LEVEL.MEDIUM, GAME_LEVEL.HARD])('%s: 힌트 수가 목표와 같다', (difficulty) => {
    const board = generateBoard(generateSolution(), difficulty);
    expect(countClues(board)).toBe(CLASSIC_DIFFICULTY[difficulty].clues);
  });

  it('expert: 힌트가 hard보다 적거나 같다 (최소 퍼즐 근처까지 판다)', () => {
    const board = generateBoard(generateSolution(), GAME_LEVEL.EXPERT);
    expect(countClues(board)).toBeLessThanOrEqual(CLASSIC_DIFFICULTY[GAME_LEVEL.HARD].clues);
  });

  it('easy: 싱글만으로 풀린다', () => {
    const board = generateBoard(generateSolution(), GAME_LEVEL.EASY);
    expect(gradePuzzle(toGrid(board))).toBe(TECHNIQUE.SINGLE);
  });

  it('expert: 추측 없이 사람 기법으로 풀린다', () => {
    const board = generateBoard(generateSolution(), GAME_LEVEL.EXPERT);
    expect(gradePuzzle(toGrid(board))).toBeLessThanOrEqual(TECHNIQUE.ADVANCED);
  });
});

describe('generateKillerCages', () => {
  const MAX_CAGE_SIZE = 4;

  it('모든 칸을 정확히 한 번씩 덮고, 케이지는 연속이며 크기·중복·합 규칙을 지킨다', () => {
    const solution = generateSolution();
    const cages = generateKillerCages(solution, MAX_CAGE_SIZE);

    const covered = cages.flatMap((cage) => cage.cells.map(([r, c]) => `${r}-${c}`));
    expect(covered.length).toBe(SUDOKU_CELL_COUNT);
    expect(new Set(covered).size).toBe(SUDOKU_CELL_COUNT);

    for (const cage of cages) {
      expect(cage.cells.length).toBeGreaterThanOrEqual(1);
      expect(cage.cells.length).toBeLessThanOrEqual(MAX_CAGE_SIZE);
      expect(isContiguous(cage.cells)).toBe(true);

      const values = cage.cells.map(([r, c]) => solution[r][c]);
      expect(new Set(values).size).toBe(values.length);
      expect(cage.sum).toBe(values.reduce((a, b) => a + b, 0));
    }

    const ids = cages.map((cage) => cage.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('generateKillerBoard', () => {
  it.each(DIFFICULTIES)('%s: 케이지 크기 제한을 지키고 힌트가 목표 이상이다', (difficulty) => {
    const solution = generateSolution();
    const { board, cages } = generateKillerBoard(solution, difficulty);
    const { clues, maxCageSize } = KILLER_DIFFICULTY[difficulty];

    expectBoardMatchesPuzzle(board, solution);
    expect(cages.every((cage: KillerCage) => cage.cells.length <= maxCageSize)).toBe(true);
    expect(countClues(board)).toBeGreaterThanOrEqual(clues);
  });

  it.each([GAME_LEVEL.EASY, GAME_LEVEL.MEDIUM])('%s: 케이지 제약 포함 유일해다', (difficulty) => {
    const { board, cages } = generateKillerBoard(generateSolution(), difficulty);
    expect(countSolutions(toGrid(board), 2, cages)).toBe(1);
  });

  it.each(DIFFICULTIES)('%s: 킬러 기법까지 포함해 추측 없이 풀린다', (difficulty) => {
    const { board, cages } = generateKillerBoard(generateSolution(), difficulty);
    expect(gradePuzzle(toGrid(board), cages)).toBeLessThanOrEqual(TECHNIQUE.ADVANCED);
  });

  it('1칸 케이지(값이 드러나는 케이지)가 없다', () => {
    const cages = generateKillerCages(generateSolution(), 3);
    expect(cages.every((cage) => cage.cells.length >= 2)).toBe(true);
  });

  it('easy → medium → hard 순으로 힌트가 줄어든다', () => {
    const solution = generateSolution();
    const ladder = [GAME_LEVEL.EASY, GAME_LEVEL.MEDIUM, GAME_LEVEL.HARD];
    const clues = ladder.map((d) => countClues(generateKillerBoard(solution, d).board));
    for (let i = 1; i < clues.length; i++) expect(clues[i]).toBeLessThanOrEqual(clues[i - 1]);
  });
});
