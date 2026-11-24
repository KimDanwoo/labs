import { act, renderHook, waitFor } from '@testing-library/react';
import { STONE } from '@views/gomoku/config/board';
import { OUTCOME } from '@views/gomoku/config/game';
import { requestMove } from '@views/gomoku/lib/moveService';
import { useGomokuGame } from '@views/gomoku/model/hooks/useGomokuGame';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@views/gomoku/lib/moveService', () => ({ requestMove: vi.fn() }));

beforeEach(() => {
  vi.mocked(requestMove).mockReset();
  vi.mocked(requestMove).mockImplementation(async (cells) => cells.findIndex((cell) => cell === STONE.EMPTY));
});

describe('흑백 선택 대국', () => {
  it('백을 선택하면 컴퓨터가 흑으로 먼저 두고 무르기를 막는다', async () => {
    const { result } = renderHook(useGomokuGame);
    act(() => result.current.selectStone(STONE.WHITE));
    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(requestMove).toHaveBeenCalledWith(expect.any(Array), STONE.BLACK);
    expect(result.current.cells[0]).toBe(STONE.BLACK);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.forbidden.size).toBe(0);
  });

  it('백으로 둔 수와 컴퓨터 응수를 무르면 첫 흑돌만 남긴다', async () => {
    const { result } = renderHook(useGomokuGame);
    act(() => result.current.selectStone(STONE.WHITE));
    await waitFor(() => expect(result.current.isThinking).toBe(false));
    act(() => result.current.place(112));
    await waitFor(() => expect(result.current.cells[1]).toBe(STONE.BLACK));
    act(() => result.current.undo());
    expect(result.current.cells.filter((cell) => cell !== STONE.EMPTY)).toEqual([STONE.BLACK]);
    expect(result.current.isThinking).toBe(false);
  });

  it('색을 바꾼 뒤 도착한 이전 컴퓨터의 응수를 무시한다', async () => {
    let finishMove: (cell: number) => void = () => undefined;
    vi.mocked(requestMove).mockReturnValueOnce(
      new Promise<number>((resolve) => {
        finishMove = resolve;
      }),
    );
    const { result } = renderHook(useGomokuGame);
    act(() => result.current.place(112));
    expect(result.current.isThinking).toBe(true);
    act(() => result.current.selectStone(STONE.WHITE));
    await waitFor(() => expect(result.current.cells[0]).toBe(STONE.BLACK));
    await act(async () => finishMove(113));
    expect(result.current.cells[113]).toBe(STONE.EMPTY);
    expect(result.current.playerStone).toBe(STONE.WHITE);
  });

  it('사람이 백이어도 백의 5목을 사람의 승리로 표시한다', async () => {
    vi.mocked(requestMove).mockImplementation(async (cells) =>
      cells.findIndex((cell, index) => cell === STONE.EMPTY && index % 2 === 0),
    );
    const { result } = renderHook(useGomokuGame);
    act(() => result.current.selectStone(STONE.WHITE));
    await waitFor(() => expect(result.current.isThinking).toBe(false));
    for (const cell of [105, 106, 107, 108, 109]) {
      act(() => result.current.place(cell));
      await waitFor(() => expect(result.current.isThinking).toBe(false));
    }
    expect(result.current.outcome).toBe(OUTCOME.WON);
  });
});
