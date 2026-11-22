import { BOARD_SIZE } from '@views/walls/config/board';

export const BOARD_VIEW = {
  viewBox: `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`,
  wallWidth: 0.16,
} as const;

export const GRID_TEMPLATE = `repeat(${BOARD_SIZE}, 1fr)`;

export const PERCENT = 100;
