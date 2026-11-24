import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { cellAt } from '@views/gomoku/lib/coords';
import { forbiddenCells, isForbidden } from '@views/gomoku/lib/forbidden';
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

  it('백은 삼삼·사사·장목을 모두 둘 수 있다', () => {
    const shapes: [number, number][][] = [
      [
        [7, 5],
        [7, 6],
        [5, 7],
        [6, 7],
      ],
      [
        [7, 4],
        [7, 5],
        [7, 6],
        [4, 7],
        [5, 7],
        [6, 7],
      ],
      [
        [7, 3],
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 8],
      ],
    ];
    shapes.forEach((stones) => {
      const cells = board([], stones);
      expect(isForbidden(cells, cellAt(7, 7), STONE.WHITE)).toBe(false);
      expect(forbiddenCells(cells, STONE.WHITE).size).toBe(0);
    });
  });

  it('흑은 사사와 장목을 둘 수 없다', () => {
    const doubleFour = board([[7, 4], [7, 5], [7, 6], [4, 7], [5, 7], [6, 7]]); // prettier-ignore
    const overline = board([[7, 3], [7, 4], [7, 5], [7, 6], [7, 8]]); // prettier-ignore
    expect(isForbidden(doubleFour, cellAt(7, 7), STONE.BLACK)).toBe(true);
    expect(isForbidden(overline, cellAt(7, 7), STONE.BLACK)).toBe(true);
  });

  it('한 방향에 서로 다른 4가 두 개 생겨도 사사다', () => {
    const cells = board([[7, 3], [7, 5], [7, 6], [7, 9]]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(true);
  });

  it('양 끝에서 완성할 수 있는 열린 4 하나는 사사가 아니다', () => {
    const cells = board([[7, 4], [7, 5], [7, 6]]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(false);
  });

  it('열린 4로 늘리는 자리가 모두 장목이면 가짜 3이다', () => {
    const cells = board([
      [7, 5], [7, 6], [5, 7], [6, 7],
      [4, 4], [5, 4], [6, 4], [8, 4], [9, 4],
      [4, 8], [5, 8], [6, 8], [8, 8], [9, 8],
    ]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(false);
  });

  it('5목과 장목이 동시에 생기면 5목 승리를 우선한다', () => {
    const cells = board([
      [7, 3], [7, 4], [7, 5], [7, 6],
      [4, 7], [5, 7], [6, 7], [8, 7], [9, 7],
    ]); // prettier-ignore
    expect(isForbidden(cells, cellAt(7, 7), STONE.BLACK)).toBe(false);
  });

  it('금수 표시가 판을 바꾸지 않는다', () => {
    const cells = board([[7, 5], [7, 6], [5, 7], [6, 7]]); // prettier-ignore
    const before = [...cells];
    expect(forbiddenCells(cells, STONE.BLACK).has(cellAt(7, 7))).toBe(true);
    expect(cells).toEqual(before);
  });
});
