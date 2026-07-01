import {
  calculateHighlights,
  clearHighlights,
  updateCellSelection,
  updateSingleCell,
} from "@features/sudoku-game/model/utils";
import { atom } from "jotai";
import {
  boardAtom,
  highlightedCellsAtom,
  selectedCellAtom,
} from "./primitives";

/** 하이라이트 업데이트 */
export const updateHighlightsAtom = atom(
  null,
  (get, set, pos: { row: number; col: number }) => {
    const board = get(boardAtom);
    const highlightedCells = get(highlightedCellsAtom);
    const newHighlights = calculateHighlights(
      board, pos.row, pos.col, highlightedCells,
    );
    set(highlightedCellsAtom, newHighlights);
  },
);

/** 셀 선택 */
export const selectCellAtom = atom(
  null,
  (get, set, pos: { row: number; col: number }) => {
    const { row, col } = pos;
    const board = get(boardAtom);
    const newBoard = updateCellSelection(board, row, col);

    if (newBoard !== board) {
      set(boardAtom, newBoard);
    }
    set(selectedCellAtom, { row, col });
    set(updateHighlightsAtom, { row, col });
  },
);

/** 셀 선택 해제 */
export const deselectCellAtom = atom(
  null,
  (get, set) => {
    const board = get(boardAtom);
    const selectedCell = get(selectedCellAtom);
    const highlightedCells = get(highlightedCellsAtom);

    if (!selectedCell) {
      set(highlightedCellsAtom, clearHighlights(highlightedCells));
      return;
    }

    const newBoard = updateSingleCell(
      board, selectedCell.row, selectedCell.col, { isSelected: false },
    );
    set(boardAtom, newBoard);
    set(selectedCellAtom, null);
    set(highlightedCellsAtom, clearHighlights(highlightedCells));
  },
);
