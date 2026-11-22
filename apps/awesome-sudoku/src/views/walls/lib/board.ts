import { EDGE_COUNT, START_PAWNS } from '@views/walls/config/board';
import { cellAt } from '@views/walls/lib/grid';
import type { Board, Move } from '@views/walls/model/types/walls';

export const createBoard = (): Board => ({
  pawns: START_PAWNS.map(([row, col]) => cellAt(row, col)),
  walls: new Uint8Array(EDGE_COUNT),
});

export const play = (board: Board, move: Move): void => {
  board.pawns[move.pawn] = move.to;
  board.walls[move.edge] = 1;
};

export const unplay = (board: Board, move: Move, from: number): void => {
  board.pawns[move.pawn] = from;
  board.walls[move.edge] = 0;
};

export const boardOf = (moves: readonly Move[]): Board => {
  const board = createBoard();
  moves.forEach((move) => play(board, move));
  return board;
};
