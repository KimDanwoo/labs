import { SudokuCell } from "@entities/board/model/types";
import { GameMode } from "@entities/game/model/types";
import { useMemo } from "react";

interface UseCellAccessibilityProps {
  cell: SudokuCell;
  row: number;
  col: number;
  gameMode: GameMode;
  isNoteMode: boolean;
  timerActive: boolean;
}

export const useCellAccessibility = ({
  cell,
  row,
  col,
  gameMode,
  isNoteMode,
  timerActive,
}: UseCellAccessibilityProps) => {
  const ariaLabel = useMemo(() => {
    const position = `${row + 1}행 ${col + 1}열`;
    const value = cell.value ? `값 ${cell.value}` : "빈 칸";
    const status = cell.isInitial ? "초기값" : "입력 가능";
    const conflict = cell.isConflict ? "충돌" : "";
    const notes = cell.notes.length > 0 ? `노트: ${cell.notes.join(", ")}` : "";

    return [position, value, status, conflict, notes].filter(Boolean).join(", ");
  }, [row, col, cell.value, cell.isInitial, cell.isConflict, cell.notes]);

  const ariaDescription = useMemo(() => {
    const mode = isNoteMode ? "노트 모드" : "입력 모드";
    const gameType = gameMode === "killer" ? "킬러 스도쿠" : "클래식 스도쿠";
    return `${gameType}, ${mode}`;
  }, [isNoteMode, gameMode]);

  const tabIndex = useMemo(() => {
    if (!timerActive) return -1;
    return row === 0 && col === 0 ? 0 : -1;
  }, [row, col, timerActive]);

  return {
    ariaLabel,
    ariaDescription,
    tabIndex,
  };
};
