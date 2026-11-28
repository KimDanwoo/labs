import type { RandomInt } from '@shared/lib/random';
import { PHASE, SIDE } from '@views/gostop/config/game';
import { computerAction } from '@views/gostop/lib/ai';
import type { GameAction, GameState } from '@views/gostop/model/types/gostop';
import { useEffect } from 'react';

const ACTIVE_PHASES: ReadonlySet<string> = new Set([PHASE.PLAY, PHASE.DECIDE]);

interface ComputerTurn {
  state: GameState;
  isSettled: boolean;
  random: RandomInt;
  delayMs: number;
}

export const useComputerTurn = (
  { state, isSettled, random, delayMs }: ComputerTurn,
  act: (action: GameAction) => void,
): void => {
  const isComputerTurn = isSettled && state.turn === SIDE.COMPUTER && ACTIVE_PHASES.has(state.phase);

  useEffect(() => {
    if (!isComputerTurn) return undefined;
    const timer = setTimeout(() => act(computerAction(state, random)), delayMs);
    return () => clearTimeout(timer);
  }, [isComputerTurn, state, act, random, delayMs]);
};
