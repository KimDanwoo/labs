import { HWATU_IMAGE, MONTH_DIGITS } from '@views/gostop/config/cardStyle';
import { CARD_KIND, MONTH_COUNT, RIBBON } from '@views/gostop/config/cards';
import { EVENT_LABEL, GOSTOP_COPY, MARK_LABEL } from '@views/gostop/config/copy';
import { PHASE, SIDE } from '@views/gostop/config/game';
import { cardOf, monthOf } from '@views/gostop/lib/cards';
import { countPi, goPoints } from '@views/gostop/lib/score';
import type {
  CardKind,
  GameResult,
  HwatuCard,
  Phase,
  ScoreBreakdown,
  Side,
  TurnReport,
} from '@views/gostop/model/types/gostop';
import type { CardMark, Entrance, GameStatus, HandCardState, Outcome, TurnChip } from '@views/gostop/model/types/view';

const RIBBON_MARK: Record<string, CardMark> = {
  [RIBBON.HONG]: 'hong',
  [RIBBON.CHEONG]: 'cheong',
  [RIBBON.CHO]: 'cho',
  [RIBBON.PLAIN]: 'plain',
};

function markOfCard(card: HwatuCard): CardMark {
  if (card.isRainGwang) return 'rainGwang';
  if (card.kind === CARD_KIND.GWANG) return 'gwang';
  if (card.isGodori) return 'godori';
  if (card.kind === CARD_KIND.YEOL) return 'yeol';
  if (card.ribbon) return RIBBON_MARK[card.ribbon] ?? 'plain';
  return card.piValue > 1 ? 'ssangPi' : 'pi';
}

export const cardMarkOf = (id: number): CardMark => markOfCard(cardOf(id));

export const cardLabel = (id: number): string => `${monthOf(id)}월 ${MARK_LABEL[cardMarkOf(id)]}`;

export const cardImageSrc = (id: number): string =>
  `${HWATU_IMAGE.monthPrefix}${String(monthOf(id)).padStart(MONTH_DIGITS, '0')}${HWATU_IMAGE.extension}`;

export const sortByMonth = (ids: readonly number[]): number[] => [...ids].sort((a, b) => a - b);

export function floorByMonth(floor: readonly number[]): number[][] {
  const slots = Array.from({ length: MONTH_COUNT }, (): number[] => []);
  sortByMonth(floor).forEach((id) => slots[monthOf(id) - 1]?.push(id));
  return slots;
}

export function capturedByKind(captured: readonly number[]): Record<CardKind, number[]> {
  const groups: Record<CardKind, number[]> = {
    [CARD_KIND.GWANG]: [],
    [CARD_KIND.YEOL]: [],
    [CARD_KIND.TTI]: [],
    [CARD_KIND.PI]: [],
  };
  sortByMonth(captured).forEach((id) => groups[cardOf(id).kind].push(id));
  return groups;
}

export const kindCount = (kind: CardKind, ids: readonly number[]): number =>
  kind === CARD_KIND.PI ? countPi(ids) : ids.length;

const KIND_POINTS: Record<CardKind, (score: ScoreBreakdown) => number> = {
  [CARD_KIND.GWANG]: (score) => score.gwang,
  [CARD_KIND.YEOL]: (score) => score.yeol + score.godori,
  [CARD_KIND.TTI]: (score) => score.tti + score.dan,
  [CARD_KIND.PI]: (score) => score.pi,
};

export const kindPoints = (kind: CardKind, score: ScoreBreakdown): number => KIND_POINTS[kind](score);

const PHASE_STATUS: Partial<Record<Phase, GameStatus>> = {
  [PHASE.READY]: 'ready',
  [PHASE.OVER]: 'over',
};

const MY_PHASE_STATUS: Partial<Record<Phase, GameStatus>> = {
  [PHASE.PLAY]: 'myTurn',
  [PHASE.DECIDE]: 'deciding',
};

export function gameStatus(phase: Phase, turn: Side): GameStatus {
  const fixed = PHASE_STATUS[phase];
  if (fixed) return fixed;
  if (turn === SIDE.COMPUTER) return 'rivalTurn';
  return MY_PHASE_STATUS[phase] ?? 'rivalTurn';
}

export function outcomeOf(result: GameResult | null): Outcome {
  if (!result?.winner) return 'draw';
  return result.winner === SIDE.ME ? 'win' : 'lose';
}

export function handCardState(isMyTurn: boolean, isMatch: boolean): HandCardState {
  if (!isMyTurn) return 'waiting';
  return isMatch ? 'match' : 'open';
}

export function entranceOf(id: number, lastTurn: TurnReport | null): Entrance {
  if (lastTurn?.flipped === id) return 'flip';
  if (lastTurn?.played !== id) return 'deal';
  return lastTurn.side === SIDE.ME ? 'fromMe' : 'fromRival';
}

export const turnKey = (lastTurn: TurnReport): string => `${lastTurn.side}-${lastTurn.played}`;

export function turnChips(lastTurn: TurnReport): TurnChip[] {
  const events = lastTurn.events.map((event, index): TurnChip => ({
    key: `${event}-${index}`,
    label: EVENT_LABEL[event],
    tone: 'lemon',
  }));
  const stolen = lastTurn.stolen.length;
  if (stolen === 0) return events;
  const stolenLabel = lastTurn.side === SIDE.ME ? GOSTOP_COPY.stolenByMe : GOSTOP_COPY.stolenByRival;
  return [...events, { key: 'stolen', label: `${stolenLabel} ${stolen}`, tone: 'ink' }];
}

export function turnSummary(lastTurn: TurnReport): string {
  const who = lastTurn.side === SIDE.ME ? GOSTOP_COPY.turnMe : GOSTOP_COPY.turnComputer;
  const taken = lastTurn.taken.length;
  return taken > 0 ? `${who} ${taken}${GOSTOP_COPY.taken}` : `${who} ${GOSTOP_COPY.placed}`;
}

export const isFreshCard = (id: number, lastTurn: TurnReport | null): boolean =>
  lastTurn?.played === id || lastTurn?.flipped === id;

export const goPreview = (total: number, goCount: number) => ({
  stop: goPoints(total, goCount),
  go: goPoints(total, goCount + 1),
});

export function goNote(goCount: Record<Side, number>): string {
  const sides: [string, number][] = [
    [GOSTOP_COPY.me, goCount[SIDE.ME]],
    [GOSTOP_COPY.computer, goCount[SIDE.COMPUTER]],
  ];
  return sides
    .filter(([, count]) => count > 0)
    .map(([who, count]) => ` · ${who} ${count}${GOSTOP_COPY.goUnit}`)
    .join('');
}
