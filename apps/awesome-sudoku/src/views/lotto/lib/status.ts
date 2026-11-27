import {
  RESULT_TITLE,
  STATUS_ANNOUNCEMENT,
  STATUS_TEXT,
  type LottoStatusKind,
  type StatusFacts,
} from '@views/lotto/config/copy';
import { formatSignedPercent, formatTickets } from '@views/lotto/lib/format';
import { countMatches } from '@views/lotto/lib/rank';
import { jackpotOutcomeOf } from '@views/lotto/lib/simulationView';
import { returnRateOf } from '@views/lotto/lib/tally';
import { isTicketFull } from '@views/lotto/lib/ticket';
import type { SimulationRun } from '@views/lotto/model/hooks/useSimulation';
import type { SingleDraw } from '@views/lotto/model/hooks/useSingleDraw';
import type { SimulationMode, SimulationRequest } from '@views/lotto/model/types/lotto';

export interface StatusInput {
  ticket: readonly number[];
  singleDraw: SingleDraw | null;
  run: SimulationRun;
  isRunNewer: boolean;
}

export interface LottoStatus {
  kind: LottoStatusKind;
  text: string;
  announcement: string;
}

const RUNNING_KIND: Record<SimulationMode, LottoStatusKind> = {
  bulk: 'bulkRunning',
  jackpot: 'jackpotRunning',
};

const JACKPOT_KIND = {
  idle: 'ready',
  running: 'jackpotRunning',
  won: 'jackpotWon',
  missed: 'jackpotMissed',
  stopped: 'jackpotStopped',
} as const satisfies Record<ReturnType<typeof jackpotOutcomeOf>, LottoStatusKind>;

export const isSameTicket = (left: readonly number[], right: readonly number[]): boolean =>
  left.length === right.length && left.every((number, index) => number === right[index]);

export function freshDrawOf(singleDraw: SingleDraw | null, ticket: readonly number[]): SingleDraw | null {
  if (singleDraw === null) return null;
  return isSameTicket(singleDraw.ticket, ticket) ? singleDraw : null;
}

export function hasRunResult(run: SimulationRun): boolean {
  const isFinished = run.status === 'done' || run.status === 'cancelled';
  const tickets = run.result?.tally.tickets ?? 0;
  return isFinished && tickets > 0;
}

function finishedKindOf(run: SimulationRun): LottoStatusKind {
  const isBulk = run.request?.mode === 'bulk';
  if (!isBulk) return JACKPOT_KIND[jackpotOutcomeOf(run)];
  return run.status === 'done' ? 'bulkDone' : 'bulkStopped';
}

function isRunForTicket(request: SimulationRequest | null, ticket: readonly number[]): boolean {
  if (request === null) return false;
  return isSameTicket(request.ticket, ticket);
}

function statusKindOf({ ticket, singleDraw, run, isRunNewer }: StatusInput): LottoStatusKind {
  const runningMode = run.status === 'running' ? run.request?.mode : undefined;
  if (runningMode) return RUNNING_KIND[runningMode];
  if (!isTicketFull(ticket)) return 'picking';
  const shouldShowRun = isRunNewer && hasRunResult(run) && isRunForTicket(run.request, ticket);
  if (shouldShowRun) return finishedKindOf(run);
  return freshDrawOf(singleDraw, ticket) ? 'drawn' : 'ready';
}

function statusFactsOf({ ticket, singleDraw, run }: StatusInput): StatusFacts {
  const tally = run.result?.tally;
  const target = run.request?.mode === 'bulk' ? run.request.count : 0;
  return {
    pickedCount: ticket.length,
    matches: singleDraw ? countMatches(ticket, singleDraw.draw.numbers) : 0,
    rank: singleDraw?.rank ?? null,
    ticketsText: formatTickets(tally?.tickets ?? 0),
    targetText: formatTickets(target),
    profitText: formatSignedPercent(tally ? returnRateOf(tally) - 1 : 0),
  };
}

export function statusOf(input: StatusInput): LottoStatus {
  const kind = statusKindOf(input);
  const facts = statusFactsOf(input);
  const text = STATUS_TEXT[kind](facts);
  return { kind, text, announcement: STATUS_ANNOUNCEMENT[kind]?.(facts) ?? text };
}

export function resultTitleOf(run: SimulationRun): string {
  const facts = statusFactsOf({ ticket: [], singleDraw: null, run, isRunNewer: true });
  return RESULT_TITLE[finishedKindOf(run)]?.(facts) ?? '';
}
