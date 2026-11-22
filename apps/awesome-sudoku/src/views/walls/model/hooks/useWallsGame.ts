import { SIDE } from '@views/walls/config/board';
import { GAME_ACTION } from '@views/walls/config/game';
import { boardOf } from '@views/walls/lib/board';
import { sideAtPly } from '@views/walls/lib/grid';
import { nextSelection, NO_SELECTION, selectionView, stepOf } from '@views/walls/lib/selection';
import { outcomeOf, surveyTerritory } from '@views/walls/lib/territory';
import { useComputerMove } from '@views/walls/model/hooks/useComputerMove';
import { gameReducer, INITIAL_STATE } from '@views/walls/model/reducer/gameReducer';
import type { Outcome, Owner, Selection, Side, Step } from '@views/walls/model/types/walls';
import { useMemo, useReducer, useState } from 'react';

export interface WallsGame {
  pawns: readonly number[];
  walls: readonly number[];
  owners: readonly Owner[];
  settled: readonly boolean[];
  scores: Record<Side, number>;
  targets: ReadonlySet<number>;
  wallOptions: readonly number[];
  selectedPawn: number | null;
  step: Step;
  outcome: Outcome;
  canUndo: boolean;
  pickCell: (cell: number) => void;
  pickWall: (edge: number) => void;
  undo: () => void;
  reset: () => void;
}

export const useWallsGame = (): WallsGame => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const board = useMemo(() => boardOf(state.moves), [state.moves]);
  const territory = useMemo(() => surveyTerritory(board), [board]);
  const isThinking = !territory.isOver && sideAtPly(state.moves.length) === SIDE.COMPUTER;
  const isLocked = isThinking || territory.isOver;
  useComputerMove(isThinking, state.moves, dispatch);

  const actions = useMemo(
    () => ({
      pickCell: (cell: number) => {
        if (!isLocked) setSelection((current) => nextSelection(board, current, cell));
      },
      pickWall: (edge: number) => {
        const { pawn, target } = selection;
        const isReady = pawn !== null && target !== null;
        if (isReady) dispatch({ type: GAME_ACTION.PLAY, move: { pawn, to: target, edge }, side: SIDE.ME });
        setSelection(NO_SELECTION);
      },
      undo: () => {
        dispatch({ type: GAME_ACTION.UNDO });
        setSelection(NO_SELECTION);
      },
      reset: () => {
        dispatch({ type: GAME_ACTION.RESET });
        setSelection(NO_SELECTION);
      },
    }),
    [board, selection, isLocked],
  );

  return useMemo(
    () => ({
      ...actions,
      ...selectionView(board, selection),
      walls: state.moves.map((move) => move.edge),
      owners: territory.owners,
      settled: territory.settled,
      scores: territory.scores,
      step: stepOf(isThinking, selection),
      outcome: outcomeOf(territory),
      canUndo: state.moves.length > 0,
    }),
    [actions, board, selection, state.moves, territory, isThinking],
  );
};
