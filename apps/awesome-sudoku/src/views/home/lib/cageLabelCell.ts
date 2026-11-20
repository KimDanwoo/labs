import { BOARD_SIZE } from '@views/home/config/board';
import type { GridPosition } from '@views/home/model/types/board';
import type { KillerCage } from '@views/home/model/types/game';

export const cageLabelCell = (cage: KillerCage): GridPosition =>
  cage.cells.reduce<GridPosition>(
    (topLeft, [r, c]) => (r < topLeft[0] || (r === topLeft[0] && c < topLeft[1]) ? [r, c] : topLeft),
    [BOARD_SIZE, BOARD_SIZE],
  );
