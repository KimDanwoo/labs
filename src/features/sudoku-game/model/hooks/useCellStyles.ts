import { buildCellClassName, getCellBorderStyles, getCellHighlightStyles } from "@entities/board/model/cellStyle";
import { CellHighlight, SudokuCell } from "@entities/board/model/types";
import { useMemo } from "react";

interface UseCellStylesProps {
  cell: SudokuCell;
  row: number;
  col: number;
  highlight: CellHighlight;
  timerActive: boolean;
}

export const useCellStyles = ({ cell, row, col, highlight, timerActive }: UseCellStylesProps) => {
  const borderStyles = useMemo(() => getCellBorderStyles(row, col), [row, col]);

  const highlightStyles = useMemo(
    () => getCellHighlightStyles(highlight, cell.isConflict),
    [highlight, cell.isConflict],
  );

  const className = useMemo(
    () => buildCellClassName(highlightStyles, borderStyles, cell.isInitial),
    [highlightStyles, borderStyles, cell.isInitial],
  );

  const stateClasses = useMemo(() => {
    const classes = [];
    if (!timerActive) classes.push("opacity-60");
    if (cell.isSelected) classes.push("ring-2 ring-blue-500");
    if (cell.isConflict) classes.push("animate-pulse");
    return classes.join(" ");
  }, [timerActive, cell.isSelected, cell.isConflict]);

  return {
    className,
    stateClasses,
  };
};
