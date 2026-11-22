import { BOARD_SIZE, CELL_COUNT, PAWNS_PER_SIDE, SIDE } from '@views/walls/config/board';
import type { Side } from '@views/walls/model/types/walls';

export interface GridStep {
  to: number;
  edge: number;
}

const LAST = BOARD_SIZE - 1;

export const rowOf = (cell: number): number => Math.floor(cell / BOARD_SIZE);

export const colOf = (cell: number): number => cell % BOARD_SIZE;

export const cellAt = (row: number, col: number): number => row * BOARD_SIZE + col;

const southEdge = (cell: number): number => cell * 2;

const eastEdge = (cell: number): number => cell * 2 + 1;

export const isEastEdge = (edge: number): boolean => edge % 2 === 1;

export const cellOfEdge = (edge: number): number => Math.floor(edge / 2);

const stepsFrom = (cell: number): (GridStep | null)[] => [
  rowOf(cell) > 0 ? { to: cell - BOARD_SIZE, edge: southEdge(cell - BOARD_SIZE) } : null,
  rowOf(cell) < LAST ? { to: cell + BOARD_SIZE, edge: southEdge(cell) } : null,
  colOf(cell) > 0 ? { to: cell - 1, edge: eastEdge(cell - 1) } : null,
  colOf(cell) < LAST ? { to: cell + 1, edge: eastEdge(cell) } : null,
];

export const STEPS: readonly (readonly (GridStep | null)[])[] = Array.from({ length: CELL_COUNT }, (_, cell) =>
  stepsFrom(cell),
);

export const rivalOf = (side: Side): Side => (side === SIDE.ME ? SIDE.COMPUTER : SIDE.ME);

export const sideAtPly = (ply: number): Side => (ply % 2 === 0 ? SIDE.ME : SIDE.COMPUTER);

export const sideOfPawn = (pawn: number): Side => (pawn < PAWNS_PER_SIDE ? SIDE.ME : SIDE.COMPUTER);

export const pawnsOf = (side: Side): number[] =>
  Array.from({ length: PAWNS_PER_SIDE }, (_, index) => side * PAWNS_PER_SIDE + index);
