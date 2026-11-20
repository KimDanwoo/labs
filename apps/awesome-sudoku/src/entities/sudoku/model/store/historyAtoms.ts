import { GAME_PHASE } from '@entities/sudoku/config/game';
import { updateCellSelection } from '@entities/sudoku/model/services/update';
import { boardAtom, selectedCellAtom } from '@entities/sudoku/model/store/primitives';
import { updateHighlightsAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { countBoardNumbersAtom, gamePhaseAtom } from '@entities/sudoku/model/store/statusAtoms';
import type { SudokuBoard } from '@entities/sudoku/model/types/board';
import { atom } from 'jotai';

const MAX_HISTORY_SIZE = 50;
const NO_CELL = -1;

export const pastAtom = atom<SudokuBoard[]>([]);

export const futureAtom = atom<SudokuBoard[]>([]);

export const canUndoAtom = atom((get) => get(pastAtom).length > 0);

export const canRedoAtom = atom((get) => get(futureAtom).length > 0);

export const pushStateAtom = atom(null, (get, set, board: SudokuBoard) => {
  set(pastAtom, [...get(pastAtom), board].slice(-MAX_HISTORY_SIZE));
  set(futureAtom, []);
});

const restoreBoardAtom = atom(null, (get, set, board: SudokuBoard) => {
  const selected = get(selectedCellAtom);
  set(boardAtom, updateCellSelection(board, selected?.row ?? NO_CELL, selected?.col ?? NO_CELL));
  set(countBoardNumbersAtom);
  if (selected) set(updateHighlightsAtom, selected);
});

export const undoAtom = atom(null, (get, set) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;
  const past = get(pastAtom);
  const previous = past.at(-1);
  if (!previous) return;

  set(pastAtom, past.slice(0, -1));
  set(futureAtom, [...get(futureAtom), get(boardAtom)]);
  set(restoreBoardAtom, previous);
});

export const redoAtom = atom(null, (get, set) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;
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
