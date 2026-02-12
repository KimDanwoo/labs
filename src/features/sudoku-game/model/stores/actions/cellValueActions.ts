import {
  HINTS_REMAINING, MAX_MISTAKES,
} from "@entities/game/model/constants";
import { SudokuStoreActionCreator } from "@features/sudoku-game/model/stores/types";
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
import {
  buildGameResultState,
  resolveBoardState,
} from "@features/sudoku-game/model/stores/helpers/gameResult";

export const createCellValueActions: SudokuStoreActionCreator<
  "fillCell" | "toggleNote" | "toggleNoteMode" | "resetUserInputs"
> = (set, get) => ({
  fillCell: (value) => {
    const {
      board, selectedCell, solution, gameMode, cages,
    } = get();

    if (!canFillCell(selectedCell, board)) return;

    const { row, col } = selectedCell!;

    const hasConflict = value !== null && (
      checkRowConflict(board, row, col, value)
      || checkColConflict(board, row, col, value)
      || checkBlockConflict(board, row, col, value)
    );

    if (hasConflict) {
      const newMistakeCount = get().mistakeCount + 1;
      set({ mistakeCount: newMistakeCount });

      if (newMistakeCount >= MAX_MISTAKES) {
        set({
          isCompleted: true,
          isSuccess: false,
        });
        get().deselectCell();
        get().toggleTimer(false);
        return;
      }
    }

    const updatedBoard = updateCellValue(
      board, row, col, value,
    );
    const { result } = resolveBoardState(
      updatedBoard, solution, gameMode, cages,
    );

    set(buildGameResultState(result));

    if (result.success) {
      get().deselectCell();
      get().toggleTimer(false);
    }

    get().countBoardNumbers();
    get().updateHighlights(row, col);
  },

  toggleNote: (value) => {
    const { board, selectedCell } = get();

    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isInitial || cell.value !== null) return;

    const currentNotes = cell.notes;
    const noteIndex = currentNotes.indexOf(value);

    const newNotes = noteIndex === -1
      ? [...currentNotes, value].sort((a, b) => a - b)
      : currentNotes.filter((note) => note !== value);

    const newBoard = updateCellNotes(
      board, row, col, newNotes,
    );

    set({ board: newBoard });
  },

  toggleNoteMode: () => {
    set((state) => ({ isNoteMode: !state.isNoteMode }));
  },

  resetUserInputs: () => {
    const { board, highlightedCells } = get();
    const newBoard = resetUserInputsOptimized(board);
    const emptyHighlights = clearHighlights(
      highlightedCells,
    );

    set({
      board: newBoard,
      highlightedCells: emptyHighlights,
      hintsRemaining: HINTS_REMAINING,
      mistakeCount: 0,
      currentTime: 0,
      isCompleted: false,
      isSuccess: false,
      isRecordSaved: false,
    });

    get().toggleTimer(true);
    get().countBoardNumbers();
  },
});
