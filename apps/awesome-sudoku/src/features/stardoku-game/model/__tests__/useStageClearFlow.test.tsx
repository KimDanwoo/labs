import { CELL_MARK, CLEAR_CELEBRATION_MS, MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { StardokuPuzzle } from '@entities/stardoku/model/types';
import { createEmptyMarks, withMark } from '@entities/stardoku/model/utils';
import {
  hintsRemainingAtom,
  livesAtom,
  marksAtom,
  puzzleAtom,
  scoreAtom,
  stageAtom,
} from '@features/stardoku-game/model/atoms';
import { useStageClearFlow } from '@features/stardoku-game/model/hooks';
import { act, renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const toRegions = (rows: string[]): number[][] => rows.map((row) => [...row].map((ch) => ch.charCodeAt(0) - 65));

const PUZZLE: StardokuPuzzle = {
  size: 6,
  regions: toRegions(['CAAAAA', 'CAABBB', 'CCEEBB', 'CCEEDF', 'CCEEFF', 'CEEEEF']),
  solution: [1, 3, 0, 4, 2, 5],
};

const solvedMarks = () =>
  PUZZLE.solution.reduce((marks, col, row) => withMark(marks, row, col, CELL_MARK.STAR), createEmptyMarks(PUZZLE.size));

const renderFlow = (store: ReturnType<typeof createStore>) =>
  renderHook(() => useStageClearFlow(), {
    wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
  });

describe('useStageClearFlow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('클리어 연출이 끝나면 다음 스테이지로 자동 진행한다 — 매 판 확인 클릭이 필요 없다', () => {
    const store = createStore();
    store.set(puzzleAtom, PUZZLE);
    store.set(marksAtom, createEmptyMarks(PUZZLE.size));
    store.set(livesAtom, MAX_LIVES);
    store.set(hintsRemainingAtom, MAX_HINTS);
    store.set(scoreAtom, 0);
    store.set(stageAtom, 3);

    const { result } = renderFlow(store);
    expect(result.current.toast).toBeNull();

    act(() => store.set(marksAtom, solvedMarks()));
    expect(result.current.toast).toBe(`STAGE 3 클리어 · +${MAX_HINTS}점`);
    expect(store.get(stageAtom)).toBe(3); // 연출 중에는 그대로

    act(() => vi.advanceTimersByTime(CLEAR_CELEBRATION_MS));

    expect(store.get(stageAtom)).toBe(4);
    expect(store.get(puzzleAtom)?.size).toBe(PUZZLE.size); // 새 판이 생성됐다
    expect(store.get(livesAtom)).toBe(MAX_LIVES);
  });
});
