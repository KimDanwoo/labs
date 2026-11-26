import { useState } from 'react';

import { SIDE } from '@views/walls/config/board';
import { OUTCOME } from '@views/walls/config/game';
import { GUIDE_POSITIONS } from '@views/walls/config/guide';
import { play } from '@views/walls/lib/board';
import { sideOfPawn } from '@views/walls/lib/grid';
import { createGuideBoard } from '@views/walls/lib/guideBoard';
import { freeEdges, moveTargets } from '@views/walls/lib/moves';
import { outcomeOf, surveyTerritory } from '@views/walls/lib/territory';
import type { Board, Move, Selection, Territory } from '@views/walls/model/types/walls';

export interface WallsGuideModel {
  board: Board;
  selection: Selection;
  targets: number[];
  edges: number[];
  territory: Territory | null;
  notice: string;
  pickCell: (cell: number) => void;
  pickWall: (edge: number) => void;
  reset: () => void;
}

export function useWallsGuide(): WallsGuideModel {
  const [position, setPosition] = useState(0);
  const [selection, setSelection] = useState<Selection>({ pawn: null, target: null });
  const [winningMove, setWinningMove] = useState<Move | null>(null);
  const [notice, setNotice] = useState('');
  const board = createGuideBoard(position);
  if (winningMove) play(board, winningMove);

  const { pawn, target } = selection;
  const targets = pawn === null ? [] : moveTargets(board, pawn);
  const edges = target === null ? [] : freeEdges(board, target);
  const territory = winningMove ? surveyTerritory(board) : null;

  function pickCell(cell: number): void {
    if (winningMove) return;
    const occupant = board.pawns.indexOf(cell);
    const isMyPawn = occupant >= 0 && sideOfPawn(occupant) === SIDE.ME;
    const canMove = pawn !== null && targets.includes(cell);
    if (canMove) {
      setSelection({ pawn, target: cell });
    } else if (isMyPawn) {
      setSelection({ pawn: occupant, target: null });
    }
    setNotice('');
  }

  function pickWall(edge: number): void {
    const canPlace = pawn !== null && target !== null && edges.includes(edge) && !winningMove;
    if (!canPlace) return;
    const move = { pawn, to: target, edge };
    const attempt = createGuideBoard(position);
    play(attempt, move);
    const result = outcomeOf(surveyTerritory(attempt));
    if (result === OUTCOME.WON) {
      setWinningMove(move);
      return;
    }
    setNotice(result === OUTCOME.PLAYING ? '두 구역이 아직 이어져 있어요.' : '상대보다 넓은 구역을 확보해 보세요.');
  }

  function reset(): void {
    setPosition((current) => (current + 1) % GUIDE_POSITIONS.length);
    setSelection({ pawn: null, target: null });
    setWinningMove(null);
    setNotice('');
  }

  return { board, selection, targets, edges, territory, notice, pickCell, pickWall, reset };
}
