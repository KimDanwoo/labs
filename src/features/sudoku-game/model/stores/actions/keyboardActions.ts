import { SudokuStoreActionCreator } from "@features/sudoku-game/model/stores/types";

export const createKeyboardActions: SudokuStoreActionCreator<"handleKeyInput"> = (set, get) => ({
  handleKeyInput: (key) => {
    const { isNoteMode } = get();

    if (key === "Backspace" || key === "Delete") {
      get().fillCell(null);
      return;
    }

    if (/^[1-9]$/.test(key)) {
      const value = parseInt(key, 10);
      if (isNoteMode) {
        get().toggleNote(value);
      } else {
        get().fillCell(value);
      }
      return;
    }

    if (!key.startsWith("Arrow")) return;

    const { selectedCell } = get();
    if (!selectedCell) return;

    let { row, col } = selectedCell;

    if (key === "ArrowUp") {
      row = Math.max(0, row - 1);
    } else if (key === "ArrowDown") {
      row = Math.min(8, row + 1);
    } else if (key === "ArrowLeft") {
      col = Math.max(0, col - 1);
    } else if (key === "ArrowRight") {
      col = Math.min(8, col + 1);
    }

    get().selectCell(row, col);
  },
});
