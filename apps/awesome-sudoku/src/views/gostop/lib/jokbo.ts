import { CARD_KIND, RIBBON } from '@views/gostop/config/cards';
import {
  DAN_SET_SIZE,
  GODORI_SET_SIZE,
  PI_BASE_COUNT,
  THREE_GWANG_COUNT,
  TTI_BASE_COUNT,
  YEOL_BASE_COUNT,
} from '@views/gostop/config/score';
import { cardOf } from '@views/gostop/lib/cards';
import { countPi } from '@views/gostop/lib/score';
import type { HwatuCard } from '@views/gostop/model/types/gostop';
import type { JokboKey } from '@views/gostop/model/types/view';

export interface JokboStep {
  key: JokboKey;
  have: number;
  need: number;
  isDone: boolean;
}

const countOf = (cards: readonly HwatuCard[], isPart: (card: HwatuCard) => boolean): number =>
  cards.filter(isPart).length;

function haveCounts(captured: readonly number[]): Record<JokboKey, number> {
  const cards = captured.map(cardOf);
  return {
    gwang: countOf(cards, (card) => card.kind === CARD_KIND.GWANG),
    godori: countOf(cards, (card) => card.isGodori),
    hong: countOf(cards, (card) => card.ribbon === RIBBON.HONG),
    cheong: countOf(cards, (card) => card.ribbon === RIBBON.CHEONG),
    cho: countOf(cards, (card) => card.ribbon === RIBBON.CHO),
    yeol: countOf(cards, (card) => card.kind === CARD_KIND.YEOL),
    tti: countOf(cards, (card) => card.kind === CARD_KIND.TTI),
    pi: countPi(captured),
  };
}

const JOKBO_NEED: Record<JokboKey, number> = {
  gwang: THREE_GWANG_COUNT,
  godori: GODORI_SET_SIZE,
  hong: DAN_SET_SIZE,
  cheong: DAN_SET_SIZE,
  cho: DAN_SET_SIZE,
  yeol: YEOL_BASE_COUNT,
  tti: TTI_BASE_COUNT,
  pi: PI_BASE_COUNT,
};

const JOKBO_ORDER: readonly JokboKey[] = ['gwang', 'godori', 'hong', 'cheong', 'cho', 'yeol', 'tti', 'pi'];

export function jokboProgress(captured: readonly number[]): JokboStep[] {
  const have = haveCounts(captured);
  return JOKBO_ORDER.map((key) => ({
    key,
    have: have[key],
    need: JOKBO_NEED[key],
    isDone: have[key] >= JOKBO_NEED[key],
  }));
}

const DAN_KEYS: ReadonlySet<JokboKey> = new Set(['hong', 'cheong', 'cho']);

export const completedDans = (captured: readonly number[]): JokboKey[] =>
  jokboProgress(captured)
    .filter((step) => DAN_KEYS.has(step.key) && step.isDone)
    .map((step) => step.key);
