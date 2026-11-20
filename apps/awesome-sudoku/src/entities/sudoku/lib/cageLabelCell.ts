import { BOARD_SIZE } from '@entities/sudoku/config/board';
import type { GridPosition } from '@entities/sudoku/model/types/board';
import type { KillerCage } from '@entities/sudoku/model/types/game';

const isBeforeInReadingOrder = ([r, c]: GridPosition, [topRow, topCol]: GridPosition): boolean =>
  r < topRow || (r === topRow && c < topCol);

export const cageLabelCell = (cage: KillerCage): GridPosition =>
  cage.cells.reduce<GridPosition>(
    (topLeft, [r, c]) => (isBeforeInReadingOrder([r, c], topLeft) ? [r, c] : topLeft),
    [BOARD_SIZE, BOARD_SIZE],
  );
