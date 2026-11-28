import { createCryptoRandom } from '@shared/lib/random';
import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { isSameMonth } from '@views/gostop/lib/cards';
import { shuffleDealableDeck } from '@views/gostop/lib/deck';
import { scoreOf } from '@views/gostop/lib/score';
import { useComputerTurn } from '@views/gostop/model/hooks/useComputerTurn';
import { gameReducer, INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameResult, Phase, ScoreBreakdown, Side, TurnReport } from '@views/gostop/model/types/gostop';
import { useMemo, useReducer, useState } from 'react';

export interface GostopGame {
  phase: Phase;
  turn: Side;
  isMyTurn: boolean;
  isDeciding: boolean;
  myHand: readonly number[];
  rivalHandCount: number;
  floor: readonly number[];
  deckCount: number;
  captured: Record<Side, readonly number[]>;
  scores: Record<Side, ScoreBreakdown>;
  goCount: Record<Side, number>;
  matchable: ReadonlySet<number>;
  lastTurn: TurnReport | null;
  result: GameResult | null;
  deal: () => void;
  play: (card: number) => void;
  go: () => void;
  stop: () => void;
  reset: () => void;
}

export const useGostopGame = (): GostopGame => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [random] = useState(createCryptoRandom);
  useComputerTurn(state, dispatch, random);

  const actions = useMemo(
    () => ({
      deal: () => dispatch({ type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(random) }),
      play: (card: number) => dispatch({ type: GAME_ACTION.PLAY, side: SIDE.ME, card }),
      go: () => dispatch({ type: GAME_ACTION.GO, side: SIDE.ME }),
      stop: () => dispatch({ type: GAME_ACTION.STOP, side: SIDE.ME }),
      reset: () => dispatch({ type: GAME_ACTION.RESET }),
    }),
    [random],
  );

  return useMemo(() => {
    const { hands, floor, deck, captured } = state.table;
    const isMine = state.turn === SIDE.ME;
    return {
      ...actions,
      phase: state.phase,
      turn: state.turn,
      isMyTurn: isMine && state.phase === PHASE.PLAY,
      isDeciding: isMine && state.phase === PHASE.DECIDE,
      myHand: hands.me,
      rivalHandCount: hands.computer.length,
      floor,
      deckCount: deck.length,
      captured,
      scores: { [SIDE.ME]: scoreOf(captured.me), [SIDE.COMPUTER]: scoreOf(captured.computer) },
      goCount: state.goCount,
      matchable: new Set(hands.me.filter((card) => floor.some((id) => isSameMonth(id, card)))),
      lastTurn: state.lastTurn,
      result: state.result,
    };
  }, [actions, state]);
};
