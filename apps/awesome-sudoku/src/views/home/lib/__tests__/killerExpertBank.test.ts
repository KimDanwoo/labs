import { SUDOKU_CELL_COUNT } from '@views/home/config/board';
import { GAME_LEVEL, GAME_MODE, KILLER_DIFFICULTY, TECHNIQUE } from '@views/home/config/game';
import { cellAt } from '@views/home/lib/gridAccess';
import { gridMove, moveKillerPuzzle } from '@views/home/lib/gridSymmetry';
import { pickKillerExpertPuzzle } from '@views/home/lib/killerExpertBank';
import { KILLER_EXPERT_PUZZLES } from '@views/home/lib/killerExpertPuzzles';
import { decodeKillerPuzzle, encodeKillerPuzzle } from '@views/home/lib/killerPuzzleCodec';
import { generatePuzzle } from '@views/home/lib/puzzleGenerator';
import { gradePuzzle } from '@views/home/lib/solver';
import { isValidSolution } from '@views/home/lib/validator';
import type { GridPosition } from '@views/home/model/types/board';
import type { KillerPuzzle } from '@views/home/model/types/game';
import { describe, expect, it } from 'vitest';

const BANK_SIZE = 200;
const GRADE_ALL_TIMEOUT_MS = 60_000;
const NEIGHBORS: GridPosition[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const ALL_MOVES = [false, true].flatMap((isTransposed) =>
  [false, true].flatMap((isRowFlipped) =>
    [false, true].map((isColFlipped) => gridMove({ isTransposed, isRowFlipped, isColFlipped })),
  ),
);

const keyOf = ([row, col]: GridPosition) => `${row}-${col}`;

function isConnected(cells: GridPosition[]): boolean {
  const inCage = new Set(cells.map(keyOf));
  const [first] = cells;
  if (!first) return false;
  const seen = new Set([keyOf(first)]);
  const queue = [first];
  for (const [row, col] of queue) {
    for (const [dr, dc] of NEIGHBORS) {
      const next: GridPosition = [row + dr, col + dc];
      if (!inCage.has(keyOf(next)) || seen.has(keyOf(next))) continue;
      seen.add(keyOf(next));
      queue.push(next);
    }
  }
  return seen.size === cells.length;
}

function expectPlayable({ solution, puzzle, cages }: KillerPuzzle) {
  expect(isValidSolution(solution)).toBe(true);
  puzzle.forEach((values, row) =>
    values.forEach((value, col) => {
      if (value) expect(value).toBe(cellAt(solution, row, col));
    }),
  );
  const covered = cages.flatMap((cage) => cage.cells.map(keyOf));
  expect(covered).toHaveLength(SUDOKU_CELL_COUNT);
  expect(new Set(covered).size).toBe(SUDOKU_CELL_COUNT);
  for (const cage of cages) {
    const digits = cage.cells.map(([row, col]) => cellAt(solution, row, col));
    expect(cage.cells.length).toBeLessThanOrEqual(KILLER_DIFFICULTY[GAME_LEVEL.EXPERT].maxCageSize);
    expect(isConnected(cage.cells)).toBe(true);
    expect(new Set(digits).size).toBe(digits.length);
    expect(digits.reduce((total, digit) => total + digit, 0)).toBe(cage.sum);
  }
}

const expectExpertGrade = ({ puzzle, cages }: KillerPuzzle) => {
  const grade = gradePuzzle(puzzle, cages);
  expect(grade).toBeGreaterThanOrEqual(TECHNIQUE.SUBSET);
  expect(grade).toBeLessThanOrEqual(TECHNIQUE.ADVANCED);
};

describe('킬러 전문가 묶음', () => {
  it(
    `저장된 ${BANK_SIZE}판은 모두 풀 수 있고, 어려움보다 높은 기법이 필요하며, 추측 없이 풀린다`,
    () => {
      expect(KILLER_EXPERT_PUZZLES).toHaveLength(BANK_SIZE);
      for (const encoded of KILLER_EXPERT_PUZZLES) {
        const puzzle = decodeKillerPuzzle(encoded);
        expectPlayable(puzzle);
        expectExpertGrade(puzzle);
      }
    },
    GRADE_ALL_TIMEOUT_MS,
  );

  it('같은 판이 겹치지 않는다', () => {
    expect(new Set(KILLER_EXPERT_PUZZLES.map(({ solution }) => solution)).size).toBe(BANK_SIZE);
  });

  it('회전·뒤집기 8가지 모두 케이지가 이어진 채로 남고 난이도가 그대로다', () => {
    const [first] = KILLER_EXPERT_PUZZLES;
    if (!first) throw new Error('묶음이 비었다');
    const original = decodeKillerPuzzle(first);
    for (const move of ALL_MOVES) {
      const moved = moveKillerPuzzle(original, move);
      expectPlayable(moved);
      expect(gradePuzzle(moved.puzzle, moved.cages)).toBe(gradePuzzle(original.puzzle, original.cages));
    }
  });

  it('저장 형식으로 바꿨다가 되돌려도 같은 판이다', () => {
    for (const encoded of KILLER_EXPERT_PUZZLES) {
      const puzzle = decodeKillerPuzzle(encoded);
      expect(decodeKillerPuzzle(encodeKillerPuzzle(puzzle))).toEqual(puzzle);
    }
  });

  it('새 게임으로 꺼낸 판도 풀 수 있는 전문가 판이다', async () => {
    const picked = await pickKillerExpertPuzzle();
    expectPlayable(picked);
    expectExpertGrade(picked);
  });

  it('킬러 전문가 요청은 묶음에서 꺼낸 판을 보드로 돌려준다', async () => {
    const { solution, board, cages } = await generatePuzzle(GAME_MODE.KILLER, GAME_LEVEL.EXPERT);
    expect(cages.length).toBeGreaterThan(0);
    board.forEach((values, row) =>
      values.forEach((cell, col) => {
        expect(cell.isInitial).toBe(cell.value !== null);
        if (cell.value !== null) expect(cell.value).toBe(cellAt(solution, row, col));
      }),
    );
  });
});
