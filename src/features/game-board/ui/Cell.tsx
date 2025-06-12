"use client";

import { CellProps } from "@entities/cell/model/types";
import { CellNotes } from "@entities/cell/ui/CellNotes";
import { CellValue } from "@entities/cell/ui/CellValue";
import { useCell } from "@features/game-board/model/hooks";
import { FC, memo } from "react";

export const SudokuCell: FC<CellProps> = memo((props) => {
  const { cell } = props;
  const { className, ariaLabel, ariaDescription, handleClick, handleKeyDown, tabIndex, stateClasses } = useCell(props);

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
      draggable={false}
      style={{
        touchAction: "manipulation",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
        boxShadow: "none",
      }}
    >
      {cell.value ? <CellValue value={cell.value} /> : <CellNotes notes={cell.notes} />}
    </td>
  );
});

SudokuCell.displayName = "SudokuCell";
