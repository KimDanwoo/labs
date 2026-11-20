import { GAME_ACTION, GAME_PHASE } from '@views/slitherlink/config/game';
import { requestPuzzle } from '@views/slitherlink/lib/puzzleService';
import type { GameAction, GameState } from '@views/slitherlink/model/types/game';
import { useEffect, type Dispatch } from 'react';

export const usePuzzleRequest = (state: GameState, dispatch: Dispatch<GameAction>): void => {
  const { phase, level, requestId } = state;

  useEffect(() => {
    if (phase !== GAME_PHASE.GENERATING) return undefined;
    let isCancelled = false;
    requestPuzzle(level)
      .catch(() => requestPuzzle(level))
      .then((puzzle) => {
        if (!isCancelled) dispatch({ type: GAME_ACTION.LOADED, requestId, puzzle });
      });
    return () => {
      isCancelled = true;
    };
  }, [phase, level, requestId, dispatch]);
};
