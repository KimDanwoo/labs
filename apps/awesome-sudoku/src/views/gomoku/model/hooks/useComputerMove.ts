import { GAME_ACTION } from '@views/gomoku/config/game';
import { requestMove } from '@views/gomoku/lib/moveService';
import type { Cell, GameAction, Stone } from '@views/gomoku/model/types/gomoku';
import { useEffect, type Dispatch } from 'react';

interface ComputerMoveOptions {
  isThinking: boolean;
  cells: readonly Cell[];
  stone: Stone;
  dispatch: Dispatch<GameAction>;
}

export const useComputerMove = ({ isThinking, cells, stone, dispatch }: ComputerMoveOptions): void => {
  useEffect(() => {
    if (!isThinking) return undefined;
    let isCancelled = false;
    requestMove(cells, stone).then((cell) => {
      if (!isCancelled) dispatch({ type: GAME_ACTION.PLACE, cell, stone });
    });
    return () => {
      isCancelled = true;
    };
  }, [isThinking, cells, stone, dispatch]);
};
