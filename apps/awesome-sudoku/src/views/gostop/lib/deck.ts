import type { RandomInt } from '@shared/lib/random';
import { CARDS_PER_MONTH, DECK_SIZE } from '@views/gostop/config/cards';
import { FLOOR_SIZE, HAND_SIZE, SIDE } from '@views/gostop/config/game';
import { monthOf } from '@views/gostop/lib/cards';
import type { Table } from '@views/gostop/model/types/gostop';

const FLOOR_START = HAND_SIZE * 2;
const DECK_START = FLOOR_START + FLOOR_SIZE;

export function shuffleDeck(random: RandomInt): number[] {
  const deck = Array.from({ length: DECK_SIZE }, (_, id) => id);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = random(index + 1);
    [deck[index], deck[target]] = [deck[target] ?? 0, deck[index] ?? 0];
  }
  return deck;
}

export const dealTable = (deck: readonly number[]): Table => ({
  hands: { [SIDE.ME]: deck.slice(0, HAND_SIZE), [SIDE.COMPUTER]: deck.slice(HAND_SIZE, FLOOR_START) },
  floor: deck.slice(FLOOR_START, DECK_START),
  deck: deck.slice(DECK_START),
  captured: { [SIDE.ME]: [], [SIDE.COMPUTER]: [] },
});

export function hasFullMonth(ids: readonly number[]): boolean {
  const counts = new Map<number, number>();
  return ids.some((id) => {
    const count = (counts.get(monthOf(id)) ?? 0) + 1;
    counts.set(monthOf(id), count);
    return count === CARDS_PER_MONTH;
  });
}

export function shuffleDealableDeck(random: RandomInt): number[] {
  let deck = shuffleDeck(random);
  while (hasFullMonth(dealTable(deck).floor)) deck = shuffleDeck(random);
  return deck;
}
