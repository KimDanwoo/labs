import { SIDE } from '@views/walls/config/board';
import { GAME_ACTION } from '@views/walls/config/game';
import { requestMove } from '@views/walls/lib/moveService';
import type { GameAction, Move } from '@views/walls/model/types/walls';
import { useEffect, type Dispatch } from 'react';

export const useComputerMove = (isThinking: boolean, moves: readonly Move[], dispatch: Dispatch<GameAction>): void => {
  useEffect(() => {
    if (!isThinking) return undefined;
    let isCancelled = false;
    requestMove(moves, SIDE.COMPUTER).then((move) => {
      const isUsable = move !== null && !isCancelled;
      if (isUsable) dispatch({ type: GAME_ACTION.PLAY, move, side: SIDE.COMPUTER });
    });
    return () => {
      isCancelled = true;
    };
  }, [isThinking, moves, dispatch]);
};
