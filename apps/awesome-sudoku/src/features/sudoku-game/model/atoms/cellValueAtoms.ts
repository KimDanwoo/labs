import {
  HINTS_REMAINING, MAX_MISTAKES,
} from "@entities/game/model/constants";
import {
  buildGameResultState,
  resolveBoardState,
} from "@features/sudoku-game/model/helpers/gameResult";
import {
  canFillCell,
  checkBlockConflict,
  checkColConflict,
  checkRowConflict,
  clearHighlights,
  resetUserInputs as resetUserInputsOptimized,
  updateCellNotes,
  updateCellValue,
} from "@features/sudoku-game/model/utils";
import { atom } from "jotai";
import {
  boardAtom,
  cagesAtom,
  currentTimeAtom,
  gameModeAtom,
  highlightedCellsAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isNoteModeAtom,
  isRecordSavedAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
  timerActiveAtom,
} from "./primitives";
import { deselectCellAtom, updateHighlightsAtom } from "./selectionAtoms";
import { countBoardNumbersAtom } from "./statusAtoms";
import { toggleTimerAtom } from "./timerAtoms";

/** 선택된 셀에 값 입력 */
export const fillCellAtom = atom(
  null,
  (get, set, value: number | null) => {
    const board = get(boardAtom);
    const selectedCell = get(selectedCellAtom);

    if (!canFillCell(selectedCell, board)) return;

    const { row, col } = selectedCell!;

    const hasConflict = value !== null && (
      checkRowConflict(board, row, col, value)
      || checkColConflict(board, row, col, value)
      || checkBlockConflict(board, row, col, value)
    );

    if (hasConflict) {
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

    const solution = get(solutionAtom);
    const gameMode = get(gameModeAtom);
    const cages = get(cagesAtom);
    const updatedBoard = updateCellValue(board, row, col, value);
    const { result } = resolveBoardState(
      updatedBoard, solution, gameMode, cages,
    );
    const state = buildGameResultState(result);

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
  },
);

/** 노트 토글 */
export const toggleNoteAtom = atom(
  null,
  (get, set, value: number) => {
    const board = get(boardAtom);
    const selectedCell = get(selectedCellAtom);

    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isInitial || cell.value !== null) return;

    const currentNotes = cell.notes;
    const noteIndex = currentNotes.indexOf(value);

    const newNotes = noteIndex === -1
      ? [...currentNotes, value].sort((a, b) => a - b)
      : currentNotes.filter((note) => note !== value);

    const newBoard = updateCellNotes(board, row, col, newNotes);
    set(boardAtom, newBoard);
  },
);

/** 노트 모드 토글 */
export const toggleNoteModeAtom = atom(
  null,
  (get, set) => {
    set(isNoteModeAtom, !get(isNoteModeAtom));
  },
);

/** 사용자 입력 초기화 (초기 셀 유지) */
export const resetUserInputsAtom = atom(
  null,
  (get, set) => {
    const board = get(boardAtom);
    const highlightedCells = get(highlightedCellsAtom);
    const newBoard = resetUserInputsOptimized(board);
    const emptyHighlights = clearHighlights(highlightedCells);

    set(boardAtom, newBoard);
    set(highlightedCellsAtom, emptyHighlights);
    set(hintsRemainingAtom, HINTS_REMAINING);
    set(mistakeCountAtom, 0);
    set(currentTimeAtom, 0);
    set(isCompletedAtom, false);
    set(isSuccessAtom, false);
    set(isRecordSavedAtom, false);

    set(toggleTimerAtom, true);
    set(countBoardNumbersAtom);
  },
);
