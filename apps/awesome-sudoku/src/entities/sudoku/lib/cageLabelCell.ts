import { BOARD_SIZE } from '@entities/sudoku/config/board';
import type { GridPosition } from '@entities/sudoku/model/types/board';
import type { KillerCage } from '@entities/sudoku/model/types/game';

export const cageLabelCell = (cage: KillerCage): GridPosition =>
  cage.cells.reduce<GridPosition>(
    (topLeft, [r, c]) => (r < topLeft[0] || (r === topLeft[0] && c < topLeft[1]) ? [r, c] : topLeft),
    [BOARD_SIZE, BOARD_SIZE],
  );
