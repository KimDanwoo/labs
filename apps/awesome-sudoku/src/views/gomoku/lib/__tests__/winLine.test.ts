import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { cellAt } from '@views/gomoku/lib/coords';
import { findWinLine } from '@views/gomoku/lib/winLine';
import { describe, expect, it } from 'vitest';

const run = (stone: number, length: number): number[] => {
  const cells = new Array<number>(CELL_COUNT).fill(STONE.EMPTY);
  for (let col = 2; col < 2 + length; col += 1) cells[cellAt(7, col)] = stone;
  return cells;
};

describe('렌주 승리 판정', () => {
  it.each([STONE.BLACK, STONE.WHITE])('정확히 5목은 %i번 돌의 승리다', (stone) => {
    expect(findWinLine(run(stone, 5), cellAt(7, 4))).toHaveLength(5);
  });

  it.each([6, 7])('흑의 %i목은 승리가 아니다', (length) => {
    expect(findWinLine(run(STONE.BLACK, length), cellAt(7, 4))).toBeNull();
  });

  it.each([6, 7])('백의 %i목도 승리다', (length) => {
    expect(findWinLine(run(STONE.WHITE, length), cellAt(7, 4))).toHaveLength(length);
  });

  it('가로 장목과 세로 5목이 함께 생겨도 흑이 이긴다', () => {
    const cells = run(STONE.BLACK, 6);
    for (let row = 3; row < 7; row += 1) cells[cellAt(row, 4)] = STONE.BLACK;
    expect(findWinLine(cells, cellAt(7, 4))).toHaveLength(5);
  });
});
