import {
  calculateHighlights,
  clearHighlights,
  updateCellSelection,
  updateSingleCell,
} from "@features/game-controls/model/utils";
import { SudokuStoreActionCreator } from "@features/game-controls/model/stores/types";

export const createSelectionActions: SudokuStoreActionCreator<
  "selectCell" | "deselectCell" | "updateHighlights"
> = (set, get) => ({
  selectCell: (row, col) => {
    const { board } = get();
    const newBoard = updateCellSelection(board, row, col);

    if (newBoard !== board) {
      set({ board: newBoard, selectedCell: { row, col } });
    } else {
      set({ selectedCell: { row, col } });
    }

    get().updateHighlights(row, col);
  },

  deselectCell: () => {
    const { board, selectedCell, highlightedCells } = get();

    if (!selectedCell) {
      set({ highlightedCells: clearHighlights(highlightedCells) });
      return;
    }

    const newBoard = updateSingleCell(board, selectedCell.row, selectedCell.col, { isSelected: false });

    set({
      board: newBoard,
      selectedCell: null,
      highlightedCells: clearHighlights(highlightedCells),
    });
  },

  updateHighlights: (row, col) => {
    const { board, highlightedCells } = get();
    const newHighlights = calculateHighlights(board, row, col, highlightedCells);
    set({ highlightedCells: newHighlights });
  },
});
