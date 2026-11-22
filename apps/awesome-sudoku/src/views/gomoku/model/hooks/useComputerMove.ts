import { COMPUTER_STONE } from '@views/gomoku/config/board';
import { GAME_ACTION } from '@views/gomoku/config/game';
import { requestMove } from '@views/gomoku/lib/moveService';
import type { Cell, GameAction } from '@views/gomoku/model/types/gomoku';
import { useEffect, type Dispatch } from 'react';

export const useComputerMove = (isThinking: boolean, cells: readonly Cell[], dispatch: Dispatch<GameAction>): void => {
  useEffect(() => {
    if (!isThinking) return undefined;
    let isCancelled = false;
    requestMove(cells, COMPUTER_STONE).then((cell) => {
      if (!isCancelled) dispatch({ type: GAME_ACTION.PLACE, cell, stone: COMPUTER_STONE });
    });
    return () => {
      isCancelled = true;
    };
  }, [isThinking, cells, dispatch]);
};
