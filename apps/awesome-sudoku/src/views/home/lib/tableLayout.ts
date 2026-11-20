import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@views/home/config/board';
import type { CellPosition, TableDimensions } from '@views/home/model/types/board';

const EMPTY_DIMENSIONS: TableDimensions = { tableRect: null, cellPositions: {} };

export function measureTable(table: HTMLTableElement): TableDimensions {
  const cells = table.querySelectorAll('td');
  if (cells.length !== SUDOKU_CELL_COUNT) return EMPTY_DIMENSIONS;

  const tableRect = table.getBoundingClientRect();
  const cellPositions: Record<string, CellPosition> = {};
  cells.forEach((cell, index) => {
    const rect = cell.getBoundingClientRect();
    cellPositions[`${Math.floor(index / BOARD_SIZE)}-${index % BOARD_SIZE}`] = {
      x: rect.left - tableRect.left,
      y: rect.top - tableRect.top,
      width: rect.width,
      height: rect.height,
    };
  });
  return { tableRect, cellPositions };
}
