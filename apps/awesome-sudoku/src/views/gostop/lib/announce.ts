import { ANNOUNCE_COPY, EVENT_LABEL, GOSTOP_COPY, OUTCOME_TITLE } from '@views/gostop/config/copy';
import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { cardLabel, outcomeOf } from '@views/gostop/lib/view';
import type { GameAction, GameResult, GameState, Side, TurnReport } from '@views/gostop/model/types/gostop';

const whoOf = (side: Side): string => (side === SIDE.ME ? GOSTOP_COPY.turnMe : GOSTOP_COPY.turnComputer);

function resultLine(result: GameResult | null): string {
  const title = OUTCOME_TITLE[outcomeOf(result)];
  if (!result?.winner) return title;
  return `${title} ${result.points}${GOSTOP_COPY.points}`;
}

function followUp(next: GameState): string {
  if (next.phase === PHASE.OVER) return resultLine(next.result);
  const isMine = next.turn === SIDE.ME;
  if (next.phase === PHASE.DECIDE) return isMine ? ANNOUNCE_COPY.deciding : '';
  return isMine ? ANNOUNCE_COPY.myTurn : ANNOUNCE_COPY.rivalTurn;
}

function stolenLine(report: TurnReport): string {
  const count = report.stolen.length;
  if (count === 0) return '';
  const label = report.side === SIDE.ME ? ANNOUNCE_COPY.stolenByMe : ANNOUNCE_COPY.stolenByRival;
  return `${label} ${count}${GOSTOP_COPY.cardUnit}.`;
}

function turnLine(report: TurnReport): string {
  const parts = [
    `${whoOf(report.side)} ${cardLabel(report.played)} ${ANNOUNCE_COPY.played}`,
    report.flipped === null ? '' : `${cardLabel(report.flipped)} ${ANNOUNCE_COPY.flipped}`,
    report.taken.length > 0 ? `${report.taken.length}${ANNOUNCE_COPY.taken}` : ANNOUNCE_COPY.placed,
    report.events.map((event) => `${EVENT_LABEL[event]}!`).join(' '),
    stolenLine(report),
  ];
  return parts.filter(Boolean).join(' ');
}

const TURN_ACTIONS: ReadonlySet<string> = new Set([GAME_ACTION.PLAY, GAME_ACTION.CHOOSE]);

const joinLines = (...lines: string[]): string => lines.filter(Boolean).join(' ');

export function announce(prev: GameState, next: GameState, action: GameAction): string {
  if (action.type === GAME_ACTION.RESET) return '';
  if (action.type === GAME_ACTION.DEAL) return joinLines(ANNOUNCE_COPY.dealt, followUp(next));
  if (next.phase === PHASE.CHOOSE) return ANNOUNCE_COPY.choosing;
  if (TURN_ACTIONS.has(action.type)) return next.lastTurn ? joinLines(turnLine(next.lastTurn), followUp(next)) : '';
  const who = whoOf(prev.turn);
  if (action.type === GAME_ACTION.GO) {
    return joinLines(`${who} ${next.goCount[prev.turn]}${GOSTOP_COPY.goUnit} ${ANNOUNCE_COPY.go}`, followUp(next));
  }
  return joinLines(`${who} ${ANNOUNCE_COPY.stop}`, followUp(next));
}
