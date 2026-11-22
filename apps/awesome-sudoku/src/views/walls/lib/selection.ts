import { SIDE } from '@views/walls/config/board';
import { STEP } from '@views/walls/config/game';
import { pawnsOf } from '@views/walls/lib/grid';
import { freeEdges, moveTargets } from '@views/walls/lib/moves';
import type { Board, Selection, Step } from '@views/walls/model/types/walls';

export const NO_SELECTION: Selection = { pawn: null, target: null };

export const nextSelection = (board: Board, current: Selection, cell: number): Selection => {
  const isTarget = current.pawn !== null && moveTargets(board, current.pawn).includes(cell);
  if (isTarget) return { pawn: current.pawn, target: cell };
  const pawn = pawnsOf(SIDE.ME).find((own) => board.pawns[own] === cell);
  return pawn === undefined ? NO_SELECTION : { pawn, target: null };
};

export const selectionView = (board: Board, { pawn, target }: Selection) => {
  const pawns = [...board.pawns];
  const isPreview = pawn !== null && target !== null;
  if (isPreview) pawns[pawn] = target;
  return {
    pawns,
    selectedPawn: pawn,
    targets: new Set(pawn === null ? [] : moveTargets(board, pawn)),
    wallOptions: target === null ? [] : freeEdges(board, target),
  };
};

export const stepOf = (isThinking: boolean, { pawn, target }: Selection): Step => {
  if (isThinking) return STEP.THINKING;
  if (target !== null) return STEP.PICK_WALL;
  return pawn === null ? STEP.PICK_PAWN : STEP.PICK_CELL;
};
