import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { cellAt } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { chooseMove } from '@views/gomoku/lib/search';
import { describe, expect, it } from 'vitest';

const board = (black: [number, number][], white: [number, number][] = []): number[] => {
  const cells = new Array<number>(CELL_COUNT).fill(STONE.EMPTY);
  black.forEach(([row, col]) => (cells[cellAt(row, col)] = STONE.BLACK));
  white.forEach(([row, col]) => (cells[cellAt(row, col)] = STONE.WHITE));
  return cells;
};

describe('isForbidden', () => {
  it('열린 3 두 개를 한 번에 만드는 수는 금수다', () => {
    const cells = board([[7, 5], [7, 6], [5, 7], [6, 7]]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(true);
  });

  it('띈 3도 열린 3으로 센다', () => {
    const cells = board([[7, 4], [7, 6], [5, 7], [6, 7]]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(true);
  });

  it('한쪽이 막힌 3과 4-3은 금수가 아니다', () => {
    const blocked = board([[7, 5], [7, 6], [5, 7], [6, 7]], [[7, 4], [7, 8]]); // prettier-ignore
    const fourThree = board([[7, 4], [7, 5], [7, 6], [5, 7], [6, 7]]); // prettier-ignore
    expect(isForbidden(blocked, cellAt(7, 7), STONE.BLACK)).toBe(false);
    expect(isForbidden(fourThree, cellAt(7, 7), STONE.BLACK)).toBe(false);
  });

  it('다섯 알이 되는 수는 삼삼이어도 둘 수 있다', () => {
    const cells = board([[7, 3], [7, 4], [7, 5], [7, 6], [5, 7], [6, 7], [8, 7], [9, 7]]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(false);
  });

  it('컴퓨터도 삼삼 자리에는 두지 않는다', () => {
    const cells = board([[0, 0], [0, 2], [14, 14], [14, 12]], [[7, 5], [7, 6], [5, 7], [6, 7]]); // prettier-ignore
    expect(chooseMove(cells, STONE.WHITE, { budgetMs: 60_000, maxDepth: 4 })).not.toBe(cellAt(7, 7));
  });
});
