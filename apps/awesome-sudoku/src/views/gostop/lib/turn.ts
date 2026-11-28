import { CARD_KIND } from '@views/gostop/config/cards';
import { STEALING_EVENTS, TURN_EVENT } from '@views/gostop/config/game';
import { bestCard, cardOf, isSameMonth, rivalOf, without } from '@views/gostop/lib/cards';
import type { Side, Table, TurnEvent, TurnReport } from '@views/gostop/model/types/gostop';

interface MatchStep {
  floor: readonly number[];
  taken: readonly number[];
  events: readonly TurnEvent[];
}

interface TurnOutcome {
  table: Table;
  report: TurnReport;
}

const PAIR_CHOICE_COUNT = 2;
const STACKED_COUNT = 3;

const sameMonthOn = (floor: readonly number[], card: number): number[] => floor.filter((id) => isSameMonth(id, card));

function matchOnFloor(floor: readonly number[], card: number): MatchStep {
  const same = sameMonthOn(floor, card);
  if (same.length === 0) return { floor: [...floor, card], taken: [], events: [] };
  if (same.length === PAIR_CHOICE_COUNT) {
    const pick = bestCard(same);
    return { floor: without(floor, [pick]), taken: [card, pick], events: [] };
  }
  const events = same.length === STACKED_COUNT ? [TURN_EVENT.COLLECT] : [];
  return { floor: without(floor, same), taken: [card, ...same], events };
}

function matchWithSameMonthFlip(floor: readonly number[], card: number, flipped: number): MatchStep {
  const same = sameMonthOn(floor, card);
  if (same.length === 1) return { floor: [...floor, card, flipped], taken: [], events: [TURN_EVENT.PPUK] };
  const event = same.length === 0 ? TURN_EVENT.JJOK : TURN_EVENT.TTADAK;
  return { floor: without(floor, same), taken: [card, flipped, ...same], events: [event] };
}

function matchTurn(floor: readonly number[], card: number, flipped: number | null): MatchStep {
  if (flipped === null) return matchOnFloor(floor, card);
  if (isSameMonth(card, flipped)) return matchWithSameMonthFlip(floor, card, flipped);
  const first = matchOnFloor(floor, card);
  const second = matchOnFloor(first.floor, flipped);
  return {
    floor: second.floor,
    taken: [...first.taken, ...second.taken],
    events: [...first.events, ...second.events],
  };
}

export function stealPi(captured: readonly number[], count: number): number[] {
  return captured
    .filter((id) => cardOf(id).kind === CARD_KIND.PI)
    .sort((a, b) => cardOf(a).piValue - cardOf(b).piValue)
    .slice(0, count);
}

export function resolveTurn(table: Table, side: Side, card: number): TurnOutcome {
  const [flipped = null, ...deck] = table.deck;
  const step = matchTurn(table.floor, card, flipped);
  const isSweep = step.floor.length === 0 && step.taken.length > 0 && deck.length > 0;
  const events = isSweep ? [...step.events, TURN_EVENT.SWEEP] : step.events;
  const rival = rivalOf(side);
  const stolen = stealPi(table.captured[rival], events.filter((event) => STEALING_EVENTS.has(event)).length);

  return {
    table: {
      hands: { ...table.hands, [side]: without(table.hands[side], [card]) },
      floor: step.floor,
      deck,
      captured: {
        ...table.captured,
        [side]: [...table.captured[side], ...step.taken, ...stolen],
        [rival]: without(table.captured[rival], stolen),
      },
    },
    report: { side, played: card, flipped, taken: step.taken, stolen, events },
  };
}
