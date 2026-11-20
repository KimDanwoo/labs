import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@entities/sudoku/config/board';
import type { CellPosition, TableDimensions } from '@entities/sudoku/model/types/board';

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

export function sizeOverlayToTable(overlay: HTMLElement | null, tableRect: DOMRect | null): void {
  if (!overlay) return;
  if (!tableRect) return;
  overlay.style.width = `${tableRect.width}px`;
  overlay.style.height = `${tableRect.height}px`;
}
