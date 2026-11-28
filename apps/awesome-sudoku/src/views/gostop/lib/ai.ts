import type { RandomInt } from '@shared/lib/random';
import { GIVE_AWAY_PENALTY, GO_MAX_RIVAL_SCORE, GO_MIN_CARDS_LEFT, STEAL_VALUE } from '@views/gostop/config/ai';
import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { bestCard, cardValue, isSameMonth, rivalOf } from '@views/gostop/lib/cards';
import { scoreOf } from '@views/gostop/lib/score';
import { bestPicks } from '@views/gostop/lib/turn';
import type { GameAction, GameState, Side, Table } from '@views/gostop/model/types/gostop';

const PAIR_CHOICE_COUNT = 2;
const STACKED_COUNT = 3;

const sumValues = (ids: readonly number[]): number => ids.reduce((sum, id) => sum + cardValue(id), 0);

function playValue(floor: readonly number[], card: number): number {
  const same = floor.filter((id) => isSameMonth(id, card));
  if (same.length === 0) return -cardValue(card) * GIVE_AWAY_PENALTY;
  if (same.length === PAIR_CHOICE_COUNT) return cardValue(card) + cardValue(bestCard(same));
  const stealBonus = same.length === STACKED_COUNT ? STEAL_VALUE : 0;
  return sumValues([card, ...same]) + stealBonus;
}

export function chooseCard(table: Table, side: Side, random: RandomInt): number {
  const options = table.hands[side].map((card) => ({ card, value: playValue(table.floor, card) }));
  const top = Math.max(...options.map((option) => option.value));
  const best = options.filter((option) => option.value === top);
  const picked = best[random(best.length)] ?? best[0];
  if (!picked) throw new Error('낼 패가 없어요');
  return picked.card;
}

export function shouldGo(state: GameState, side: Side): boolean {
  const hasCardsToPlay = state.table.hands[side].length >= GO_MIN_CARDS_LEFT;
  const isRivalFar = scoreOf(state.table.captured[rivalOf(side)]).total <= GO_MAX_RIVAL_SCORE;
  return hasCardsToPlay && isRivalFar;
}

export function computerAction(state: GameState, random: RandomInt): GameAction {
  const side = SIDE.COMPUTER;
  if (state.phase !== PHASE.DECIDE) {
    const card = chooseCard(state.table, side, random);
    return { type: GAME_ACTION.PLAY, side, card, picks: bestPicks(state.table, card) };
  }
  if (shouldGo(state, side)) return { type: GAME_ACTION.GO, side };
  return { type: GAME_ACTION.STOP, side };
}
