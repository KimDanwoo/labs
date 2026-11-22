import { STONE } from '@views/gomoku/config/board';
import { GAME_ACTION } from '@views/gomoku/config/game';
import { gameReducer, INITIAL_STATE } from '@views/gomoku/model/reducer/gameReducer';
import type { GameState, Stone } from '@views/gomoku/model/types/gomoku';
import { describe, expect, it } from 'vitest';

const place = (state: GameState, cell: number, stone: Stone): GameState =>
  gameReducer(state, { type: GAME_ACTION.PLACE, cell, stone });

describe('gameReducer', () => {
  it('차례가 아닌 돌과 이미 놓인 칸은 무시한다', () => {
    const first = place(INITIAL_STATE, 0, STONE.BLACK);
    expect(place(INITIAL_STATE, 0, STONE.WHITE)).toBe(INITIAL_STATE);
    expect(place(first, 0, STONE.WHITE)).toBe(first);
    expect(place(first, 1, STONE.BLACK)).toBe(first);
  });

  it('다섯 알이 이어지면 이긴 줄을 남기고 더 두지 못한다', () => {
    const cells = [0, 15, 1, 16, 2, 17, 3, 18, 4];
    const done = cells.reduce(
      (state, cell, ply) => place(state, cell, ply % 2 === 0 ? STONE.BLACK : STONE.WHITE),
      INITIAL_STATE,
    );
    expect([...(done.winLine ?? [])].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    expect(place(done, 19, STONE.WHITE)).toBe(done);
  });

  it('무르면 내 차례로 돌아온다', () => {
    const two = place(place(INITIAL_STATE, 0, STONE.BLACK), 1, STONE.WHITE);
    const three = place(two, 2, STONE.BLACK);
    expect(gameReducer(two, { type: GAME_ACTION.UNDO }).moves).toEqual([]);
    expect(gameReducer(three, { type: GAME_ACTION.UNDO }).moves).toEqual([0, 1]);
  });
});
