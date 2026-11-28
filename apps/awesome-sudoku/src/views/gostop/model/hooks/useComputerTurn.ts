import type { RandomInt } from '@shared/lib/random';
import { COMPUTER_DELAY_MS, PHASE, SIDE } from '@views/gostop/config/game';
import { computerAction } from '@views/gostop/lib/ai';
import type { GameAction, GameState } from '@views/gostop/model/types/gostop';
import { useEffect, type Dispatch } from 'react';

const ACTIVE_PHASES: ReadonlySet<string> = new Set([PHASE.PLAY, PHASE.DECIDE]);

export const useComputerTurn = (state: GameState, dispatch: Dispatch<GameAction>, random: RandomInt): void => {
  const isComputerTurn = state.turn === SIDE.COMPUTER && ACTIVE_PHASES.has(state.phase);

  useEffect(() => {
    if (!isComputerTurn) return undefined;
    const timer = setTimeout(() => dispatch(computerAction(state, random)), COMPUTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isComputerTurn, state, dispatch, random]);
};
