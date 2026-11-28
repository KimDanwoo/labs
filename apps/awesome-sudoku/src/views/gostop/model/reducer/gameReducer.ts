import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { WIN_SCORE } from '@views/gostop/config/score';
import { rivalOf } from '@views/gostop/lib/cards';
import { dealTable } from '@views/gostop/lib/deck';
import { DRAW_RESULT, scoreOf, winResult } from '@views/gostop/lib/score';
import { nextChoice, resolveTurn } from '@views/gostop/lib/turn';
import type { GameAction, GameState, Side } from '@views/gostop/model/types/gostop';

const NO_GO = { [SIDE.ME]: 0, [SIDE.COMPUTER]: 0 };

export const INITIAL_STATE: GameState = {
  phase: PHASE.READY,
  table: {
    hands: { [SIDE.ME]: [], [SIDE.COMPUTER]: [] },
    floor: [],
    deck: [],
    captured: { [SIDE.ME]: [], [SIDE.COMPUTER]: [] },
  },
  turn: SIDE.ME,
  goCount: NO_GO,
  goScore: NO_GO,
  lastTurn: null,
  pending: null,
  result: null,
};

const deal = (deck: readonly number[]): GameState => ({ ...INITIAL_STATE, phase: PHASE.PLAY, table: dealTable(deck) });

const scoreNow = (state: GameState, side: Side): number => scoreOf(state.table.captured[side]).total;

const stop = (state: GameState, side: Side): GameState => ({
  ...state,
  phase: PHASE.OVER,
  result: winResult(state, side),
});

function afterTurn(state: GameState, side: Side): GameState {
  const score = scoreNow(state, side);
  const canDecide = score >= WIN_SCORE && score > state.goScore[side];
  if (canDecide) {
    const isHandEmpty = state.table.hands[side].length === 0;
    return isHandEmpty ? stop(state, side) : { ...state, phase: PHASE.DECIDE };
  }
  const isOutOfCards = Object.values(state.table.hands).every((hand) => hand.length === 0);
  if (isOutOfCards) return { ...state, phase: PHASE.OVER, result: DRAW_RESULT };
  return { ...state, turn: rivalOf(side) };
}

interface Play {
  side: Side;
  card: number;
  picks: readonly number[];
}

function resolvePlay(state: GameState, { side, card, picks }: Play): GameState {
  const choice = nextChoice(state.table, card, picks);
  if (choice) return { ...state, phase: PHASE.CHOOSE, pending: { card, picks, choice } };
  const { table, report } = resolveTurn(state.table, side, card, picks);
  return afterTurn({ ...state, phase: PHASE.PLAY, table, lastTurn: report, pending: null }, side);
}

function play(state: GameState, { side, card, picks }: Play): GameState {
  const isAllowed = state.phase === PHASE.PLAY && state.turn === side && state.table.hands[side].includes(card);
  return isAllowed ? resolvePlay(state, { side, card, picks }) : state;
}

function choose(state: GameState, side: Side, pick: number): GameState {
  const { pending } = state;
  const isChoosing = state.phase === PHASE.CHOOSE && state.turn === side && pending !== null;
  if (!isChoosing) return state;
  if (!pending.choice.options.includes(pick)) return state;
  return resolvePlay(state, { side, card: pending.card, picks: [...pending.picks, pick] });
}

const isDeciding = (state: GameState, side: Side): boolean => state.phase === PHASE.DECIDE && state.turn === side;

function go(state: GameState, side: Side): GameState {
  if (!isDeciding(state, side)) return state;
  return {
    ...state,
    phase: PHASE.PLAY,
    turn: rivalOf(side),
    goCount: { ...state.goCount, [side]: state.goCount[side] + 1 },
    goScore: { ...state.goScore, [side]: scoreNow(state, side) },
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === GAME_ACTION.DEAL) return deal(action.deck);
  if (action.type === GAME_ACTION.PLAY)
    return play(state, { side: action.side, card: action.card, picks: action.picks ?? [] });
  if (action.type === GAME_ACTION.CHOOSE) return choose(state, action.side, action.pick);
  if (action.type === GAME_ACTION.GO) return go(state, action.side);
  if (action.type === GAME_ACTION.STOP) return isDeciding(state, action.side) ? stop(state, action.side) : state;
  return INITIAL_STATE;
}
