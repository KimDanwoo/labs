import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { cellAt } from '@views/gomoku/lib/coords';
import { findForcingMove } from '@views/gomoku/lib/forcingSearch';
import { createPosition, shift } from '@views/gomoku/lib/position';
import { describe, expect, it } from 'vitest';

const position = () => {
  const pos = createPosition(new Array<number>(CELL_COUNT).fill(STONE.EMPTY));
  [
    [7, 3],
    [7, 4],
    [7, 6],
    [5, 5],
    [8, 5],
  ].forEach(([row = 0, col = 0]) => {
    shift(pos, cellAt(row, col), STONE.WHITE, 1);
  });
  shift(pos, cellAt(7, 2), STONE.BLACK, 1);
  return pos;
};

describe('연속 4 강제 승리 탐색', () => {
  it('한 번 막게 한 뒤 다른 방향으로 이기는 수순을 읽는다', () => {
    const pos = position();
    expect(findForcingMove(pos, STONE.WHITE, performance.now() + 1000)).toBe(cellAt(7, 5));
  });

  it('탐색 뒤 판·점수·위치 키를 복원한다', () => {
    const pos = position();
    const before = createPosition(pos.cells);
    findForcingMove(pos, STONE.WHITE, performance.now() + 1000);
    expect(pos).toEqual(before);
  });

  it('상대가 즉시 이길 수 있으면 공격만으로 이긴다고 판단하지 않는다', () => {
    const pos = position();
    for (let col = 0; col < 4; col += 1) shift(pos, cellAt(0, col), STONE.BLACK, 1);
    expect(findForcingMove(pos, STONE.WHITE, performance.now() + 1000)).toBeNull();
  });

  it('시간이 끝나면 강제 승리를 주장하지 않고 판을 보존한다', () => {
    const pos = position();
    const before = createPosition(pos.cells);
    expect(findForcingMove(pos, STONE.WHITE, performance.now() - 1)).toBeNull();
    expect(pos).toEqual(before);
  });
});
