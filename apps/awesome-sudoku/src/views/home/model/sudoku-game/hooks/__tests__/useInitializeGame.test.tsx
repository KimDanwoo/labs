import { renderHook, waitFor } from '@testing-library/react';
import { cellAt } from '@views/home/lib/gridAccess';
import { requestPuzzle } from '@views/home/lib/puzzleService';
import { fillCellAtom } from '@views/home/model/store/cellValueAtoms';
import { resumeOrStartGameAtom } from '@views/home/model/store/gameLifecycleAtoms';
import {
  boardAtom,
  currentTimeAtom,
  highlightedCellsAtom,
  isCompletedAtom,
  isGeneratingAtom,
  mistakeCountAtom,
  PERSISTED_GAME_ATOMS,
  selectedCellAtom,
  solutionAtom,
} from '@views/home/model/store/primitives';
import { useInitializeGame } from '@views/home/model/sudoku-game/hooks/useInitializeGame';
import type { Grid, SudokuBoard } from '@views/home/model/types/board';
import { createStore, Provider } from 'jotai';
import { StrictMode, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@views/home/lib/puzzleService', () => ({ requestPuzzle: vi.fn() }));

const requestPuzzleMock = vi.mocked(requestPuzzle);

const SOLUTION: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];
const BLANK = { row: 0, col: 0 };
const OTHER_BLANK = { row: 8, col: 8 };
const SAVED_TIME = 123;

const isBlank = (row: number, col: number) =>
  [BLANK, OTHER_BLANK].some((blank) => blank.row === row && blank.col === col);

const puzzleBoard = (): SudokuBoard =>
  SOLUTION.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      value: isBlank(rowIndex, colIndex) ? null : value,
      isInitial: !isBlank(rowIndex, colIndex),
      isSelected: rowIndex === BLANK.row && colIndex === BLANK.col,
      isConflict: false,
      isHint: false,
      notes: [],
    })),
  );

const saveToStorage = (entries: Record<string, unknown>) =>
  Object.entries(entries).forEach(([key, value]) => localStorage.setItem(`sudoku:${key}`, JSON.stringify(value)));

const SAVED_GAME = {
  board: puzzleBoard(),
  solution: SOLUTION,
  selectedCell: BLANK,
  currentTime: SAVED_TIME,
  mistakeCount: 1,
  timerActive: true,
};

type GameStore = ReturnType<typeof createStore>;

const renderBoard = (store: GameStore) =>
  renderHook(() => useInitializeGame(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <Provider store={store}>{children}</Provider>
      </StrictMode>
    ),
  });

const renderOnFreshPage = () => {
  const store = createStore();
  renderBoard(store);
  return store;
};

describe('useInitializeGame — 이어 하기와 새로 시작', () => {
  beforeEach(() => {
    localStorage.clear();
    requestPuzzleMock.mockReset();
    requestPuzzleMock.mockResolvedValue({ board: puzzleBoard(), solution: SOLUTION, cages: [] });
  });

  it('저장된 판이 있으면 새 판을 만들지 않고 그대로 이어 한다', () => {
    saveToStorage(SAVED_GAME);

    const store = renderOnFreshPage();

    expect(requestPuzzleMock).not.toHaveBeenCalled();
    expect(store.get(boardAtom)).toEqual(SAVED_GAME.board);
    expect(store.get(currentTimeAtom)).toBe(SAVED_TIME);
    expect(store.get(mistakeCountAtom)).toBe(1);
    expect(store.get(highlightedCellsAtom)[`${BLANK.row}-${BLANK.col}`]?.selected).toBe(true);
  });

  it('이어 한 판에서 정답을 넣으면 실수로 세지 않는다 — 화면이 구독하지 않는 정답도 함께 돌아온다', () => {
    saveToStorage(SAVED_GAME);

    const store = renderOnFreshPage();
    store.set(fillCellAtom, cellAt(SOLUTION, BLANK.row, BLANK.col));

    expect(store.get(solutionAtom)).toEqual(SOLUTION);
    expect(cellAt(store.get(boardAtom), BLANK.row, BLANK.col).value).toBe(cellAt(SOLUTION, BLANK.row, BLANK.col));
    expect(store.get(mistakeCountAtom)).toBe(1);
  });

  it('저장된 판이 없으면 새 판을 하나 만든다', async () => {
    const store = renderOnFreshPage();

    await waitFor(() => expect(store.get(solutionAtom)).toEqual(SOLUTION));
    expect(requestPuzzleMock).toHaveBeenCalledTimes(1);
  });

  it('지난 방문에 끝낸 판은 이어 하지 않고 새 판을 만든다', async () => {
    saveToStorage({ ...SAVED_GAME, isCompleted: true, timerActive: false });

    const store = renderOnFreshPage();

    await waitFor(() => expect(store.get(isCompletedAtom)).toBe(false));
    expect(requestPuzzleMock).toHaveBeenCalledTimes(1);
    expect(store.get(currentTimeAtom)).toBe(0);
  });

  it('이번 방문에 끝낸 판은 다른 화면에 다녀와도 그대로 남는다', () => {
    saveToStorage(SAVED_GAME);
    const store = createStore();
    renderBoard(store).unmount();
    store.set(isCompletedAtom, true);

    renderBoard(store);

    expect(requestPuzzleMock).not.toHaveBeenCalled();
    expect(store.get(isCompletedAtom)).toBe(true);
  });

  it('저장된 선택 칸이 보드 밖이면 선택 없이 이어 한다', () => {
    saveToStorage({ ...SAVED_GAME, selectedCell: { row: 9, col: 0 } });

    const store = renderOnFreshPage();

    expect(requestPuzzleMock).not.toHaveBeenCalled();
    expect(store.get(selectedCellAtom)).toBeNull();
    expect(
      store
        .get(boardAtom)
        .flat()
        .some((cell) => cell.isSelected),
    ).toBe(false);
  });

  it('새 판 만들기에 실패하면 다음에 다시 시도한다 — 지난 방문에 끝낸 판으로 돌아가지 않는다', async () => {
    saveToStorage({ ...SAVED_GAME, isCompleted: true, timerActive: false });
    const store = createStore();
    PERSISTED_GAME_ATOMS.forEach((persistedAtom) => store.sub(persistedAtom, () => undefined));
    requestPuzzleMock.mockRejectedValueOnce(new Error('생성 실패'));

    await expect(store.set(resumeOrStartGameAtom)).rejects.toThrow('생성 실패');
    expect(store.get(isGeneratingAtom)).toBe(false);

    await store.set(resumeOrStartGameAtom);
    expect(requestPuzzleMock).toHaveBeenCalledTimes(2);
    expect(store.get(isCompletedAtom)).toBe(false);
  });

  it('저장된 보드와 정답이 서로 맞지 않으면 새 판으로 덮어쓴다', async () => {
    const otherSolution = SOLUTION.map((row) => [...row].reverse());
    saveToStorage({ ...SAVED_GAME, solution: otherSolution });

    const store = renderOnFreshPage();

    await waitFor(() => expect(store.get(solutionAtom)).toEqual(SOLUTION));
    expect(requestPuzzleMock).toHaveBeenCalledTimes(1);
    expect(store.get(currentTimeAtom)).toBe(0);
  });
});
