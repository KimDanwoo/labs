import { BOARD_SIZE, STONE } from '@views/gomoku/config/board';
import type { Stone } from '@views/gomoku/model/types/gomoku';

export const rowOf = (cell: number): number => Math.floor(cell / BOARD_SIZE);

export const colOf = (cell: number): number => cell % BOARD_SIZE;

export const cellAt = (row: number, col: number): number => row * BOARD_SIZE + col;

export const isInside = (row: number, col: number): boolean =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const rivalOf = (stone: Stone): Stone => (stone === STONE.BLACK ? STONE.WHITE : STONE.BLACK);

export const stoneAtPly = (ply: number): Stone => (ply % 2 === 0 ? STONE.BLACK : STONE.WHITE);
