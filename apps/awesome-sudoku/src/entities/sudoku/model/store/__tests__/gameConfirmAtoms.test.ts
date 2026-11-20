import { GAME_LEVEL, GAME_MODE } from '@entities/sudoku/config/game';
import { requestPuzzle } from '@entities/sudoku/lib/puzzleService';
import {
  confirmDiscardAtom,
  gameConfirmAtom,
  keepCurrentGameAtom,
  requestNewGameAtom,
  requestRestartAtom,
} from '@entities/sudoku/model/store/gameConfirmAtoms';
import {
  boardAtom,
  currentTimeAtom,
  difficultyAtom,
  gameModeAtom,
  isCompletedAtom,
  mistakeCountAtom,
} from '@entities/sudoku/model/store/primitives';
import type { SudokuBoard } from '@entities/sudoku/model/types/board';
import { createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@entities/sudoku/lib/puzzleService', () => ({ requestPuzzle: vi.fn() }));

const requestPuzzleMock = vi.mocked(requestPuzzle);

const board = (edit: Partial<SudokuBoard[number][number]> = {}): SudokuBoard =>
  Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ({
      value: null,
      isInitial: false,
      isSelected: false,
      isConflict: false,
      isHint: false,
      notes: [],
      ...(row === 0 && col === 0 ? edit : {}),
    })),
  );

const KILLER_HARD = { mode: GAME_MODE.KILLER, difficulty: GAME_LEVEL.HARD };

function storeWith(current: SudokuBoard, { isCompleted = false } = {}) {
  const store = createStore();
  store.set(boardAtom, current);
  store.set(isCompletedAtom, isCompleted);
  store.set(gameModeAtom, GAME_MODE.CLASSIC);
  store.set(difficultyAtom, GAME_LEVEL.MEDIUM);
  return store;
}

beforeEach(() => {
  localStorage.clear();
  requestPuzzleMock.mockReset();
  requestPuzzleMock.mockReturnValue(new Promise(() => {}));
});

describe('새 게임 요청', () => {
  it('입력한 칸이 없으면 묻지 않고 바로 시작한다', () => {
    const store = storeWith(board());
    store.set(requestNewGameAtom, KILLER_HARD);
    expect(store.get(gameConfirmAtom)).toBeNull();
    expect(store.get(gameModeAtom)).toBe(GAME_MODE.KILLER);
    expect(requestPuzzleMock).toHaveBeenCalledWith(GAME_MODE.KILLER, GAME_LEVEL.HARD);
  });

  it.each([
    ['숫자를 입력한', { value: 4 }],
    ['메모만 남긴', { notes: [2, 7] }],
  ])('%s 게임이면 확인을 먼저 묻고, 아직 판을 바꾸지 않는다', (_, edit) => {
    const store = storeWith(board(edit));
    store.set(requestNewGameAtom, { difficulty: GAME_LEVEL.EXPERT });
    expect(store.get(gameConfirmAtom)).toEqual({
      action: { kind: 'newGame', request: { mode: GAME_MODE.CLASSIC, difficulty: GAME_LEVEL.EXPERT } },
      isOpen: true,
    });
    expect(requestPuzzleMock).not.toHaveBeenCalled();
    expect(store.get(difficultyAtom)).toBe(GAME_LEVEL.MEDIUM);
  });

  it('처음부터 주어진 숫자는 진행으로 보지 않는다', () => {
    const store = storeWith(board({ value: 4, isInitial: true }));
    store.set(requestNewGameAtom, KILLER_HARD);
    expect(store.get(gameConfirmAtom)).toBeNull();
  });

  it('끝난 게임은 묻지 않는다', () => {
    const store = storeWith(board({ value: 4 }), { isCompleted: true });
    store.set(requestNewGameAtom, KILLER_HARD);
    expect(store.get(gameConfirmAtom)).toBeNull();
    expect(requestPuzzleMock).toHaveBeenCalledOnce();
  });

  it('계속하기를 고르면 지금 게임과 모드를 그대로 둔다', () => {
    const current = board({ value: 4 });
    const store = storeWith(current);
    store.set(requestNewGameAtom, KILLER_HARD);
    store.set(keepCurrentGameAtom);
    expect(store.get(gameConfirmAtom)?.isOpen).toBe(false);
    expect(store.get(gameModeAtom)).toBe(GAME_MODE.CLASSIC);
    expect(store.get(boardAtom)).toBe(current);
    expect(requestPuzzleMock).not.toHaveBeenCalled();
  });

  it('새 게임을 고르면 요청한 모드와 난이도로 시작하고, 두 번 눌러도 한 번만 만든다', () => {
    const store = storeWith(board({ value: 4 }));
    store.set(requestNewGameAtom, KILLER_HARD);
    store.set(confirmDiscardAtom);
    store.set(confirmDiscardAtom);
    expect(store.get(gameConfirmAtom)?.isOpen).toBe(false);
    expect(store.get(gameModeAtom)).toBe(GAME_MODE.KILLER);
    expect(requestPuzzleMock).toHaveBeenCalledOnce();
    expect(requestPuzzleMock).toHaveBeenCalledWith(GAME_MODE.KILLER, GAME_LEVEL.HARD);
  });
});

describe('다시 하기 요청', () => {
  it('진행 중이면 먼저 묻고, 계속하기를 고르면 입력·시간·오답을 그대로 둔다', () => {
    const current = board({ value: 4 });
    const store = storeWith(current);
    store.set(currentTimeAtom, 90);
    store.set(mistakeCountAtom, 2);
    store.set(requestRestartAtom);
    expect(store.get(gameConfirmAtom)).toEqual({ action: { kind: 'restart' }, isOpen: true });
    store.set(keepCurrentGameAtom);
    expect(store.get(boardAtom)).toBe(current);
    expect(store.get(currentTimeAtom)).toBe(90);
    expect(store.get(mistakeCountAtom)).toBe(2);
  });

  it('다시 하기를 고르면 같은 판에서 입력·시간·오답만 지우고 새 판은 만들지 않는다', () => {
    const store = storeWith(board({ value: 4, notes: [] }));
    store.set(currentTimeAtom, 90);
    store.set(mistakeCountAtom, 2);
    store.set(requestRestartAtom);
    store.set(confirmDiscardAtom);
    expect(store.get(boardAtom)[0]?.[0]?.value).toBeNull();
    expect(store.get(currentTimeAtom)).toBe(0);
    expect(store.get(mistakeCountAtom)).toBe(0);
    expect(requestPuzzleMock).not.toHaveBeenCalled();
  });

  it('입력한 칸이 없으면 묻지 않고 바로 처음으로 돌린다', () => {
    const store = storeWith(board());
    store.set(currentTimeAtom, 90);
    store.set(requestRestartAtom);
    expect(store.get(gameConfirmAtom)).toBeNull();
    expect(store.get(currentTimeAtom)).toBe(0);
  });
});
