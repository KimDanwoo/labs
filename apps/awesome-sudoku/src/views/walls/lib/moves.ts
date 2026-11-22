import { STEP_MAX } from '@views/walls/config/board';
import { pawnsOf, STEPS } from '@views/walls/lib/grid';
import type { Board, Move, Side } from '@views/walls/model/types/walls';

const openCells = (board: Board, cell: number): number[] =>
  STEPS[cell]!.flatMap((step) => {
    const isOpen = !!step && board.walls[step.edge] === 0 && !board.pawns.includes(step.to);
    return isOpen ? [step.to] : [];
  });

export const moveTargets = (board: Board, pawn: number): number[] => {
  const from = board.pawns[pawn]!;
  const reached = new Set([from]);
  let frontier = [from];
  for (let count = 0; count < STEP_MAX; count += 1) {
    frontier = frontier.flatMap((cell) => openCells(board, cell)).filter((cell) => !reached.has(cell));
    frontier.forEach((cell) => reached.add(cell));
  }
  return [...reached];
};

export const freeEdges = (board: Board, cell: number): number[] =>
  STEPS[cell]!.flatMap((step) => {
    const isFree = step !== null && board.walls[step.edge] === 0;
    return isFree ? [step.edge] : [];
  });

export const legalMoves = (board: Board, side: Side): Move[] =>
  pawnsOf(side).flatMap((pawn) =>
    moveTargets(board, pawn).flatMap((to) => freeEdges(board, to).map((edge) => ({ pawn, to, edge }))),
  );

export const isLegal = (board: Board, side: Side, move: Move): boolean =>
  legalMoves(board, side).some((legal) => {
    const isSame = legal.pawn === move.pawn && legal.to === move.to && legal.edge === move.edge;
    return isSame;
  });
