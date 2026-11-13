import { atom } from 'jotai';
import { updateCellSelection } from '../services/update';
import type { SudokuBoard } from '../types/board';
import { boardAtom, isCompletedAtom, selectedCellAtom } from './primitives';
import { updateHighlightsAtom } from './selectionAtoms';
import { countBoardNumbersAtom } from './statusAtoms';

const MAX_HISTORY_SIZE = 50;
/** 어느 칸과도 겹치지 않는 좌표 — updateCellSelection에 넘기면 선택 표시가 모두 꺼진다 */
const NO_CELL = -1;

/** undo 스택 — 바뀌기 전 보드. 보드는 불변이라 참조를 그대로 쌓는다 */
export const pastAtom = atom<SudokuBoard[]>([]);

export const futureAtom = atom<SudokuBoard[]>([]);

export const canUndoAtom = atom((get) => get(pastAtom).length > 0);

export const canRedoAtom = atom((get) => get(futureAtom).length > 0);

export const pushStateAtom = atom(null, (get, set, board: SudokuBoard) => {
  set(pastAtom, [...get(pastAtom), board].slice(-MAX_HISTORY_SIZE));
  set(futureAtom, []);
});

/**
 * 스냅샷은 저장 당시의 선택 표시를 품고 있어 지금 선택에 맞춰 다시 칠한다.
 * 보드만 되돌린다 — 실수 횟수·남은 힌트는 되돌리지 않는다(되돌리면 실수를 지우는 우회로가 된다).
 */
const restoreBoardAtom = atom(null, (get, set, board: SudokuBoard) => {
  const selected = get(selectedCellAtom);
  set(boardAtom, updateCellSelection(board, selected?.row ?? NO_CELL, selected?.col ?? NO_CELL));
  set(countBoardNumbersAtom);
  if (selected) set(updateHighlightsAtom, selected);
});

export const undoAtom = atom(null, (get, set) => {
  if (get(isCompletedAtom)) return;
  const past = get(pastAtom);
  const previous = past.at(-1);
  if (!previous) return;

  set(pastAtom, past.slice(0, -1));
  set(futureAtom, [...get(futureAtom), get(boardAtom)]);
  set(restoreBoardAtom, previous);
});

export const redoAtom = atom(null, (get, set) => {
  if (get(isCompletedAtom)) return;
  const future = get(futureAtom);
  const next = future.at(-1);
  if (!next) return;

  set(futureAtom, future.slice(0, -1));
  set(pastAtom, [...get(pastAtom), get(boardAtom)]);
  set(restoreBoardAtom, next);
});

export const clearHistoryAtom = atom(null, (_get, set) => {
  set(pastAtom, []);
  set(futureAtom, []);
});
