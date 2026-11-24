import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { cellsOf } from '@views/gomoku/lib/board';
import { cellAt, rivalOf, stoneAtPly } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { completionCells, createPosition, rankCandidates } from '@views/gomoku/lib/position';
import { chooseMove } from '@views/gomoku/lib/search';
import { findWinLine } from '@views/gomoku/lib/winLine';
import type { Stone } from '@views/gomoku/model/types/gomoku';
import { describe, expect, it } from 'vitest';

const LIMITS = { budgetMs: 60_000, maxDepth: 4 };

const board = (black: [number, number][], white: [number, number][]): number[] => {
  const cells = new Array<number>(CELL_COUNT).fill(STONE.EMPTY);
  black.forEach(([row, col]) => (cells[cellAt(row, col)] = STONE.BLACK));
  white.forEach(([row, col]) => (cells[cellAt(row, col)] = STONE.WHITE));
  return cells;
};

const greedy = (cells: number[], stone: Stone): number => rankCandidates(createPosition(cells), stone, 1)[0] ?? 0;

const playOut = (engine: Stone): Stone | null => {
  const moves: number[] = [cellAt(7, 7)];
  while (moves.length < CELL_COUNT) {
    const stone = stoneAtPly(moves.length);
    const cells = cellsOf(moves);
    const move = stone === engine ? chooseMove(cells, stone, LIMITS) : greedy(cells, stone);
    moves.push(move);
    if (findWinLine(cellsOf(moves), move)) return stone;
  }
  return null;
};

describe('chooseMove', () => {
  it('빈 판이면 가운데에 둔다', () => {
    expect(chooseMove(board([], []), STONE.BLACK, LIMITS)).toBe(cellAt(7, 7));
  });

  it('이길 수 있으면 상대 4를 막지 않고 바로 이긴다', () => {
    const cells = board(
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[7, 3], [7, 4], [7, 5], [7, 6]],
    ); // prettier-ignore
    expect([cellAt(7, 2), cellAt(7, 7)]).toContain(chooseMove(cells, STONE.WHITE, LIMITS));
  });

  it('상대의 4를 막는다', () => {
    const cells = board([[7, 3], [7, 4], [7, 5], [7, 6]], [[6, 3], [6, 4], [8, 5], [7, 2]]); // prettier-ignore
    expect(chooseMove(cells, STONE.WHITE, LIMITS)).toBe(cellAt(7, 7));
  });

  it('상대의 열린 3을 막는다', () => {
    const cells = board([[7, 5], [7, 6], [7, 7]], [[6, 6], [8, 8]]); // prettier-ignore
    expect([cellAt(7, 3), cellAt(7, 4), cellAt(7, 8), cellAt(7, 9)]).toContain(chooseMove(cells, STONE.WHITE, LIMITS));
  });

  it('4-3을 만들어 이긴다', () => {
    const cells = board([[2, 2], [2, 3], [12, 12]], [[7, 5], [7, 6], [7, 7], [5, 8], [6, 8]]); // prettier-ignore
    const move = chooseMove(cells, STONE.WHITE, LIMITS);
    expect(move).toBe(cellAt(7, 8));
  });

  it.each([STONE.BLACK, STONE.WHITE] as const)('한 수 앞만 보는 상대를 %i번 돌로 이긴다', (engine) => {
    expect(playOut(engine)).toBe(engine);
    expect(rivalOf(engine)).not.toBe(engine);
  });
  it('백 컴퓨터는 삼삼 자리에도 둘 수 있다', () => {
    const cells = board([[0, 0], [0, 2], [14, 14], [14, 12]], [[7, 5], [7, 6], [5, 7], [6, 7]]); // prettier-ignore
    expect(chooseMove(cells, STONE.WHITE, LIMITS)).toBe(cellAt(7, 7));
  });

  it('흑 컴퓨터는 사사 자리를 선택하지 않는다', () => {
    const cells = board([[7, 4], [7, 5], [7, 6], [4, 7], [5, 7], [6, 7]], [[0, 0], [0, 2]]); // prettier-ignore
    const move = chooseMove(cells, STONE.BLACK, { budgetMs: 100, maxDepth: 4 });
    expect(move).not.toBe(cellAt(7, 7));
    expect(isForbidden(cells, move, STONE.BLACK)).toBe(false);
  });

  it('흑의 장목 완성 자리를 승리나 유효한 후보로 읽지 않는다', () => {
    const cells = board([[7, 3], [7, 4], [7, 5], [7, 6], [7, 8]], [[7, 2]]); // prettier-ignore
    const pos = createPosition(cells);
    expect(completionCells(pos, STONE.BLACK)).toEqual([]);
    expect(rankCandidates(pos, STONE.BLACK, CELL_COUNT)).not.toContain(cellAt(7, 7));
    expect(chooseMove(cells, STONE.BLACK, { budgetMs: 100, maxDepth: 4 })).not.toBe(cellAt(7, 7));
  });
});
