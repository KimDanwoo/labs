import { BOARD_SIZE, STAR_POINTS } from '@views/gomoku/config/board';

const HALF = 0.5;
const range = Array.from({ length: BOARD_SIZE }, (_, index) => index + HALF);

export const GRID_VIEW = {
  viewBox: `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`,
  start: HALF,
  end: BOARD_SIZE - HALF,
  lines: range,
  lineWidth: 0.04,
  starRadius: 0.11,
  stars: STAR_POINTS.map(([row, col]) => ({ x: col + HALF, y: row + HALF })),
} as const;

export const GRID_TEMPLATE = `repeat(${BOARD_SIZE}, 1fr)`;
