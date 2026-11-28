import { CARD_KIND, CARDS, RIBBON } from '@views/gostop/config/cards';
import { SIDE } from '@views/gostop/config/game';
import type { CardKind, HwatuCard, Side } from '@views/gostop/model/types/gostop';

const KIND_VALUE: Record<CardKind, number> = {
  [CARD_KIND.GWANG]: 5,
  [CARD_KIND.YEOL]: 2,
  [CARD_KIND.TTI]: 1.5,
  [CARD_KIND.PI]: 0,
};
const RAIN_GWANG_VALUE = 3;
const GODORI_BONUS = 1.5;
const DAN_BONUS = 0.5;

export const cardOf = (id: number): HwatuCard => {
  const card = CARDS[id];
  if (!card) throw new Error(`없는 카드예요: ${id}`);
  return card;
};

export const monthOf = (id: number): number => cardOf(id).month;

export const isSameMonth = (a: number, b: number): boolean => monthOf(a) === monthOf(b);

export const rivalOf = (side: Side): Side => (side === SIDE.ME ? SIDE.COMPUTER : SIDE.ME);

export function cardValue(id: number): number {
  const card = cardOf(id);
  if (card.isRainGwang) return RAIN_GWANG_VALUE;
  const isDan = card.ribbon !== null && card.ribbon !== RIBBON.PLAIN;
  const bonus = (card.isGodori ? GODORI_BONUS : 0) + (isDan ? DAN_BONUS : 0);
  return KIND_VALUE[card.kind] + card.piValue + bonus;
}

export const bestCard = (ids: readonly number[]): number =>
  ids.reduce((best, id) => (cardValue(id) > cardValue(best) ? id : best));

export const without = (ids: readonly number[], removed: readonly number[]): number[] =>
  ids.filter((id) => !removed.includes(id));
