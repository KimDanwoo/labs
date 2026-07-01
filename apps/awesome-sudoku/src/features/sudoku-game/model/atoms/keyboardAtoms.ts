import { BOARD_MAX_INDEX } from "@entities/board/model/constants";
import { atom } from "jotai";
import { isNoteModeAtom, selectedCellAtom } from "./primitives";
import { fillCellAtom, toggleNoteAtom } from "./cellValueAtoms";
import { selectCellAtom } from "./selectionAtoms";

/** 키보드 입력 처리 */
export const handleKeyInputAtom = atom(
  null,
  (get, set, key: string) => {
    const isNoteMode = get(isNoteModeAtom);

    if (key === "Backspace" || key === "Delete") {
      set(fillCellAtom, null);
      return;
    }

    if (/^[1-9]$/.test(key)) {
      const value = parseInt(key, 10);
      if (isNoteMode) {
        set(toggleNoteAtom, value);
      } else {
        set(fillCellAtom, value);
      }
      return;
    }

    if (!key.startsWith("Arrow")) return;

    const selectedCell = get(selectedCellAtom);
    if (!selectedCell) return;

    let { row, col } = selectedCell;

    if (key === "ArrowUp") {
      row = Math.max(0, row - 1);
    } else if (key === "ArrowDown") {
      row = Math.min(BOARD_MAX_INDEX, row + 1);
    } else if (key === "ArrowLeft") {
      col = Math.max(0, col - 1);
    } else if (key === "ArrowRight") {
      col = Math.min(BOARD_MAX_INDEX, col + 1);
    }

    set(selectCellAtom, { row, col });
  },
);
