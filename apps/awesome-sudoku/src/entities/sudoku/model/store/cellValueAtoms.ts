import { GAME_PHASE, HINTS_REMAINING, MAX_MISTAKES } from '@entities/sudoku/config/game';
import { cellAt } from '@entities/sudoku/lib/gridAccess';
import { buildGameResultState, resolveBoardState } from '@entities/sudoku/model/services/gameResult';
import {
  canFillCell,
  clearHighlights,
  resetUserInputs as resetUserInputsOptimized,
  updateCellNotes,
  updateCellValue,
} from '@entities/sudoku/model/services/update';
import { clearHistoryAtom, pushStateAtom } from '@entities/sudoku/model/store/historyAtoms';
import {
  boardAtom,
  cagesAtom,
  currentTimeAtom,
  gameModeAtom,
  highlightedCellsAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isNoteModeAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
  timerActiveAtom,
} from '@entities/sudoku/model/store/primitives';
import { deselectCellAtom, updateHighlightsAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { countBoardNumbersAtom, gamePhaseAtom } from '@entities/sudoku/model/store/statusAtoms';
import { toggleTimerAtom } from '@entities/sudoku/model/store/timerAtoms';
import { atom } from 'jotai';

export const fillCellAtom = atom(null, (get, set, value: number | null) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;
  const board = get(boardAtom);
  const selectedCell = get(selectedCellAtom);

  if (!canFillCell(selectedCell, board)) return;

  const { row, col } = selectedCell!;
  if (cellAt(board, row, col).value === value) return;

  const solution = get(solutionAtom);

  // 퍼즐은 유일해라 정답과 다른 값은 곧 오답이다 — 킬러의 케이지 규칙 위반까지 한 기준으로 잡힌다.
  const isMistake = value !== null && value !== cellAt(solution, row, col);

  if (isMistake) {
    const newMistakeCount = get(mistakeCountAtom) + 1;
    set(mistakeCountAtom, newMistakeCount);

    if (newMistakeCount >= MAX_MISTAKES) {
      set(isCompletedAtom, true);
      set(isSuccessAtom, false);
      set(deselectCellAtom);
      set(toggleTimerAtom, false);
      return;
    }
  }

  const gameMode = get(gameModeAtom);
  const cages = get(cagesAtom);
  const updatedBoard = updateCellValue(board, row, col, value);
  const { result } = resolveBoardState(updatedBoard, solution, gameMode, cages);
  const state = buildGameResultState(result);

  set(pushStateAtom, board);
  set(boardAtom, state.board);
  set(isCompletedAtom, state.isCompleted);
  set(isSuccessAtom, state.isSuccess);
  set(timerActiveAtom, state.timerActive);

  if (result.success) {
    set(deselectCellAtom);
    set(toggleTimerAtom, false);
  }

  set(countBoardNumbersAtom);
  set(updateHighlightsAtom, { row, col });
});

export const toggleNoteAtom = atom(null, (get, set, value: number) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;
  const board = get(boardAtom);
  const selectedCell = get(selectedCellAtom);

  if (!selectedCell) return;

  const { row, col } = selectedCell;
  const cell = cellAt(board, row, col);

  if (cell.isInitial || cell.value !== null) return;

  const currentNotes = cell.notes;
  const noteIndex = currentNotes.indexOf(value);

  const newNotes =
    noteIndex === -1 ? [...currentNotes, value].sort((a, b) => a - b) : currentNotes.filter((note) => note !== value);

  const newBoard = updateCellNotes(board, row, col, newNotes);
  set(pushStateAtom, board);
  set(boardAtom, newBoard);
});

export const toggleNoteModeAtom = atom(null, (get, set) => {
  set(isNoteModeAtom, !get(isNoteModeAtom));
});

export const resetUserInputsAtom = atom(null, (get, set) => {
  const board = get(boardAtom);
  const highlightedCells = get(highlightedCellsAtom);
  const newBoard = resetUserInputsOptimized(board);
  const emptyHighlights = clearHighlights(highlightedCells);

  set(boardAtom, newBoard);
  set(clearHistoryAtom);
  set(highlightedCellsAtom, emptyHighlights);
  set(hintsRemainingAtom, HINTS_REMAINING);
  set(mistakeCountAtom, 0);
  set(currentTimeAtom, 0);
  set(isCompletedAtom, false);
  set(isSuccessAtom, false);

  set(toggleTimerAtom, true);
  set(countBoardNumbersAtom);
});
