import { buildCellClassName, getCellBorderStyles, getCellHighlightStyles } from "@entities/cell/model/cellStyle";
import { CellProps } from "@entities/cell/model/types";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { KeyboardEvent, useCallback, useMemo } from "react";

export const useCell = ({ cell, row, col, onSelect }: CellProps) => {
  const highlightedCells = useSudokuStore((state) => state.highlightedCells);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const timerActive = useSudokuStore((state) => state.timerActive);

  const cellKey = `${row}-${col}`;
  const EMPTY_HIGHLIGHT = { selected: false, related: false, sameValue: false } as const;
  const highlight = highlightedCells[cellKey] ?? EMPTY_HIGHLIGHT;

  // 메모화된 스타일 계산
  const borderStyles = useMemo(() => getCellBorderStyles(row, col), [row, col]);
  const highlightStyles = useMemo(
    () => getCellHighlightStyles(highlight, cell.isConflict),
    [highlight, cell.isConflict],
  );
  const className = useMemo(
    () => buildCellClassName(highlightStyles, borderStyles, cell.isInitial),
    [highlightStyles, borderStyles, cell.isInitial],
  );

  // 접근성을 위한 ARIA 레이블 생성
  const ariaLabel = useMemo(() => {
    const position = `${row + 1}행 ${col + 1}열`;
    const value = cell.value ? `값 ${cell.value}` : "빈 칸";
    const status = cell.isInitial ? "초기값" : "입력 가능";
    const conflict = cell.isConflict ? "충돌" : "";
    const notes = cell.notes.length > 0 ? `노트: ${cell.notes.join(", ")}` : "";

    return [position, value, status, conflict, notes].filter(Boolean).join(", ");
  }, [row, col, cell.value, cell.isInitial, cell.isConflict, cell.notes]);

  // 접근성을 위한 역할 및 상태 설명
  const ariaDescription = useMemo(() => {
    const mode = isNoteMode ? "노트 모드" : "입력 모드";
    const gameType = gameMode === "killer" ? "킬러 스도쿠" : "클래식 스도쿠";
    return `${gameType}, ${mode}`;
  }, [isNoteMode, gameMode]);

  // 클릭 핸들러 최적화
  const handleClick = useCallback(() => {
    if (timerActive) {
      onSelect(row, col);
    }
  }, [onSelect, row, col, timerActive]);

  // 키보드 접근성 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableCellElement>) => {
      if (!timerActive) return;

      const keyPressed = event.key;

      if (keyPressed === "Enter" || keyPressed === " ") {
        event.preventDefault();
        onSelect(row, col);
      }

      // 숫자 입력 직접 처리
      if (/^[1-9]$/.test(keyPressed)) {
        event.preventDefault();
        onSelect(row, col);
        // 키 입력을 스토어로 전달 (선택 후 입력)
        setTimeout(() => {
          const store = useSudokuStore.getState();
          store.handleKeyInput(keyPressed);
        }, 0);
      }

      // 삭제 키 처리
      if (keyPressed === "Backspace" || keyPressed === "Delete") {
        event.preventDefault();
        onSelect(row, col);
        setTimeout(() => {
          const store = useSudokuStore.getState();
          store.handleKeyInput(keyPressed);
        }, 0);
      }
    },
    [timerActive, onSelect, row, col],
  );

  // 포커스 가능한 요소로 만들기 위한 tabIndex 설정
  const tabIndex = useMemo(() => {
    if (!timerActive) return -1;
    // 첫 번째 셀만 기본 포커스 가능, 나머지는 프로그래밍적 포커스만
    return row === 0 && col === 0 ? 0 : -1;
  }, [row, col, timerActive]);

  // 셀 상태에 따른 추가 클래스
  const stateClasses = useMemo(() => {
    const classes = [];
    if (!timerActive) classes.push("opacity-60");
    if (cell.isSelected) classes.push("ring-2 ring-blue-500");
    if (cell.isConflict) classes.push("animate-pulse");
    return classes.join(" ");
  }, [timerActive, cell.isSelected, cell.isConflict]);

  return {
    className,
    ariaLabel,
    ariaDescription,
    handleClick,
    handleKeyDown,
    tabIndex,
    stateClasses,
  };
};
