"use client";

import { CellProps } from "@entities/cell/model/types";
import { CellNotes } from "@entities/cell/ui/CellNotes";
import { CellValue } from "@entities/cell/ui/CellValue";
import { useCell } from "@features/game-board/model/hooks";
import { FC, memo } from "react";

export const SudokuCell: FC<CellProps> = memo(({ cell, row, col, onSelect }) => {
  const { className, ariaLabel, ariaDescription, handleClick, handleKeyDown, tabIndex, stateClasses } = useCell({
    cell,
    row,
    col,
    onSelect,
  });

  return (
    <td
      className={`${className} ${stateClasses}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      role="gridcell"
      aria-label={ariaLabel}
      aria-description={ariaDescription}
      aria-selected={cell.isSelected}
      aria-invalid={cell.isConflict}
      aria-readonly={cell.isInitial}
      // 드래그 방지 및 터치 최적화
      draggable={false}
      style={{
        touchAction: "manipulation",
        userSelect: "none",
      }}
    >
      {cell.value ? <CellValue value={cell.value} /> : <CellNotes notes={cell.notes} />}
    </td>
  );
});

SudokuCell.displayName = "SudokuCell";
