"use client";

import { CellProps } from "@entities/cell/model/types";
import { buildCellClassName, getCellBorderStyles, getCellHighlightStyles } from "@entities/cell/model/utils";
import { CellNotes } from "@entities/cell/ui/CellNotes";
import { CellValue } from "@entities/cell/ui/CellValue";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { FC, useMemo } from "react";

export const SudokuCell: FC<CellProps> = ({ cell, row, col, onSelect }) => {
  const highlightedCells = useSudokuStore((state) => state.highlightedCells);

  const cellKey = `${row}-${col}`;
  const highlight = highlightedCells[cellKey] || {
    selected: false,
    related: false,
    sameValue: false,
  };

  const borderStyles = useMemo(() => getCellBorderStyles(row, col), [row, col]);

  const highlightStyles = useMemo(
    () => getCellHighlightStyles(highlight, cell.isConflict),
    [highlight, cell.isConflict],
  );

  const className = useMemo(
    () => buildCellClassName(highlightStyles, borderStyles, cell.isInitial),
    [highlightStyles, borderStyles, cell.isInitial],
  );

  const handleClick = () => {
    onSelect(row, col);
  };

  return (
    <td className={className} onClick={handleClick}>
      {cell.value ? <CellValue value={cell.value} /> : <CellNotes notes={cell.notes} />}
    </td>
  );
};
