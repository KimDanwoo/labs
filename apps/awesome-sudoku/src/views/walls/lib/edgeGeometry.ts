import { BOARD_SIZE } from '@views/walls/config/board';
import { PERCENT } from '@views/walls/config/boardView';
import { cellOfEdge, colOf, isEastEdge, rowOf } from '@views/walls/lib/grid';

export const edgeLine = (edge: number) => {
  const row = rowOf(cellOfEdge(edge));
  const col = colOf(cellOfEdge(edge));
  return isEastEdge(edge)
    ? { x1: col + 1, y1: row, x2: col + 1, y2: row + 1 }
    : { x1: col, y1: row + 1, x2: col + 1, y2: row + 1 };
};

const toPercent = (value: number): string => `${(value / BOARD_SIZE) * PERCENT}%`;

const HALF = 0.5;

export const cellCenter = (cell: number) => ({
  left: toPercent(colOf(cell) + HALF),
  top: toPercent(rowOf(cell) + HALF),
});

export const edgeCenter = (edge: number) => {
  const { x1, y1, x2, y2 } = edgeLine(edge);
  return { left: toPercent((x1 + x2) / 2), top: toPercent((y1 + y2) / 2) };
};
