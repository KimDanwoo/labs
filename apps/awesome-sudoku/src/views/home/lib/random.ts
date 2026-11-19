import { BOARD_SIZE } from '../config/board';
import { shuffleArray } from '../model/services/common';
import type { GridPosition } from '../model/types/board';

export const shuffledPositions = (): GridPosition[] => {
  const positions: GridPosition[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) positions.push([r, c]);
  shuffleArray(positions);
  return positions;
};
export const randomInt = (maxExclusive: number): number => Math.floor(Math.random() * maxExclusive);
