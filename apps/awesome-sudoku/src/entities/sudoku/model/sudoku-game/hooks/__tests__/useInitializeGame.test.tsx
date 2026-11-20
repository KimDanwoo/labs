import { GAME_LEVEL, GAME_MODE } from '@entities/sudoku/config/game';
import { cellAt } from '@entities/sudoku/lib/gridAccess';
import { requestPuzzle } from '@entities/sudoku/lib/puzzleService';
import { fillCellAtom } from '@entities/sudoku/model/store/cellValueAtoms';
import { resumeOrStartGameAtom } from '@entities/sudoku/model/store/gameLifecycleAtoms';
import { parkedGamesAtom } from '@entities/sudoku/model/store/parkedGameAtoms';
import {
  boardAtom,
  currentTimeAtom,
  gameModeAtom,
  highlightedCellsAtom,
  isCompletedAtom,
  isGeneratingAtom,
  mistakeCountAtom,
  PERSISTED_GAME_ATOMS,
  selectedCellAtom,
  solutionAtom,
} from '@entities/sudoku/model/store/primitives';
import { useInitializeGame } from '@entities/sudoku/model/sudoku-game/hooks/useInitializeGame';
import type { Grid, SudokuBoard } from '@entities/sudoku/model/types/board';
import type { GameMode } from '@entities/sudoku/model/types/game';
import { renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { StrictMode, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@entities/sudoku/lib/puzzleService', () => ({ requestPuzzle: vi.fn() }));

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

const renderBoard = (store: GameStore, mode: GameMode = GAME_MODE.CLASSIC) =>
  renderHook(() => useInitializeGame(mode), {
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

const KILLER_GAME = {
  ...SAVED_GAME,
  currentTime: SAVED_TIME + 1,
  cages: [{ id: 0, sum: SOLUTION[0]?.[0] ?? 0, cells: [[0, 0]] }],
};

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
};

describe('useInitializeGame — 주소별 모드와 쉬는 판', () => {
  beforeEach(() => {
    localStorage.clear();
    requestPuzzleMock.mockReset();
    requestPuzzleMock.mockResolvedValue({ board: puzzleBoard(), solution: SOLUTION, cages: [] });
  });

  it('킬러를 하던 채로 클래식을 열면 킬러 판은 쉬는 판으로 남고 클래식은 새로 시작한다', async () => {
    saveToStorage({ ...KILLER_GAME, gameMode: GAME_MODE.KILLER });

    const store = renderOnFreshPage();

    await waitFor(() => expect(requestPuzzleMock).toHaveBeenCalledWith(GAME_MODE.CLASSIC, GAME_LEVEL.MEDIUM));
    expect(store.get(gameModeAtom)).toBe(GAME_MODE.CLASSIC);
    expect(store.get(parkedGamesAtom)[GAME_MODE.KILLER]?.currentTime).toBe(KILLER_GAME.currentTime);
    expect(store.get(parkedGamesAtom)[GAME_MODE.KILLER]?.board).toEqual(KILLER_GAME.board);
  });

  it('킬러로 돌아오면 쉬던 판을 그대로 이어 하고, 떠난 클래식 판은 쉬는 판이 된다', async () => {
    saveToStorage({ ...KILLER_GAME, gameMode: GAME_MODE.KILLER });
    const store = createStore();
    renderBoard(store).unmount();
    await waitFor(() => expect(store.get(solutionAtom)).toEqual(SOLUTION));

    renderBoard(store, GAME_MODE.KILLER);

    expect(requestPuzzleMock).toHaveBeenCalledTimes(1);
    expect(store.get(gameModeAtom)).toBe(GAME_MODE.KILLER);
    expect(store.get(boardAtom)).toEqual(KILLER_GAME.board);
    expect(store.get(currentTimeAtom)).toBe(KILLER_GAME.currentTime);
    expect(store.get(parkedGamesAtom)[GAME_MODE.KILLER]).toBeUndefined();
    expect(store.get(parkedGamesAtom)[GAME_MODE.CLASSIC]?.solution).toEqual(SOLUTION);
  });

  it('새 판을 만드는 중에 다른 모드로 옮기면 늦게 도착한 판이 옮겨 간 판을 덮지 않는다', async () => {
    const lateClassic = deferred<{ board: SudokuBoard; solution: Grid; cages: [] }>();
    requestPuzzleMock.mockReturnValueOnce(lateClassic.promise);
    saveToStorage({ parkedGames: { [GAME_MODE.KILLER]: KILLER_GAME } });
    const store = createStore();
    renderBoard(store).unmount();

    renderBoard(store, GAME_MODE.KILLER);
    lateClassic.resolve({ board: puzzleBoard(), solution: SOLUTION, cages: [] });
    await lateClassic.promise;

    expect(store.get(gameModeAtom)).toBe(GAME_MODE.KILLER);
    expect(store.get(boardAtom)).toEqual(KILLER_GAME.board);
    expect(store.get(isGeneratingAtom)).toBe(false);
  });

  it('쉬는 판이 망가져 있으면 버리고 그 모드의 새 판을 만든다', async () => {
    saveToStorage({ parkedGames: { [GAME_MODE.KILLER]: { ...KILLER_GAME, solution: [[0]] } } });

    renderBoard(createStore(), GAME_MODE.KILLER);

    await waitFor(() => expect(requestPuzzleMock).toHaveBeenCalledWith(GAME_MODE.KILLER, GAME_LEVEL.MEDIUM));
  });
});
