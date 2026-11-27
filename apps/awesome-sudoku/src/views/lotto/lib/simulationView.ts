import type { CSSProperties } from 'react';

import { LOTTO_COPY, type JackpotFacts, type JackpotOutcome } from '@views/lotto/config/copy';
import { BALL_REVEAL_STEP_MS, PERCENT } from '@views/lotto/config/display';
import { LOTTO_DRAWN_COUNT, LOTTO_PICK_COUNT, TICKET_PRICE, type LottoRank } from '@views/lotto/config/lotto';
import { BALL_TONE_CEILINGS, type BallTone, type StatTone } from '@views/lotto/config/style';
import { formatBuyingDuration, formatOdds, formatTickets, formatWon } from '@views/lotto/lib/format';
import { targetTicketsOf } from '@views/lotto/lib/simulate';
import { observedOddsOf, returnRateOf, spentOf } from '@views/lotto/lib/tally';
import type { SimulationRun } from '@views/lotto/model/hooks/useSimulation';
import type { SimulationMode, SimulationRequest, SimulationStatus, Tally } from '@views/lotto/model/types/lotto';

const FALLBACK_TONE: BallTone = 'green';

export const ballToneOf = (number: number): BallTone =>
  BALL_TONE_CEILINGS.find(({ ceiling }) => number <= ceiling)?.tone ?? FALLBACK_TONE;

export const ticketSlotsOf = (ticket: readonly number[]): readonly (number | null)[] =>
  Array.from({ length: LOTTO_PICK_COUNT }, (_, index) => ticket[index] ?? null);

export const revealStyleOf = (index: number): CSSProperties => ({ animationDelay: `${index * BALL_REVEAL_STEP_MS}ms` });

export const verdictRevealStyle: CSSProperties = revealStyleOf(LOTTO_DRAWN_COUNT);

export const phaseOfMode = (run: SimulationRun, mode: SimulationMode): SimulationStatus =>
  run.request?.mode === mode ? run.status : 'idle';

export function progressRatioOf(run: SimulationRun): number {
  const tickets = run.result?.tally.tickets ?? 0;
  if (!run.request) return 0;
  return Math.min(1, tickets / targetTicketsOf(run.request));
}

export const progressPercentOf = (ratio: number): number => Math.round(ratio * PERCENT);

const UNFINISHED_JACKPOT_OUTCOME: Record<Exclude<SimulationStatus, 'done'>, JackpotOutcome> = {
  idle: 'idle',
  running: 'running',
  cancelled: 'stopped',
};

export function jackpotOutcomeOf(run: SimulationRun): JackpotOutcome {
  const phase = phaseOfMode(run, 'jackpot');
  if (phase !== 'done') return UNFINISHED_JACKPOT_OUTCOME[phase];
  return run.result?.hasJackpot ? 'won' : 'missed';
}

export function jackpotFactsOf(tally: Tally | null): JackpotFacts {
  const tickets = tally?.tickets ?? 0;
  return {
    ticketsText: formatTickets(tickets),
    spentText: formatWon(tickets * TICKET_PRICE),
    durationText: formatBuyingDuration(tickets),
  };
}

export function profitToneOf(tally: Tally): StatTone {
  const profit = returnRateOf(tally) - 1;
  if (spentOf(tally) === 0) return 'plain';
  if (profit > 0) return 'gain';
  return profit < 0 ? 'loss' : 'plain';
}

export const returnPerTicketOf = (tally: Tally): number => returnRateOf(tally) * TICKET_PRICE;

export function observedOddsTextOf(tally: Tally | null, rank: LottoRank, neverHitText: string): string {
  const hasNoRun = tally === null;
  if (hasNoRun) return formatOdds(0);
  if (tally.counts[rank] === 0) return neverHitText;
  return formatOdds(observedOddsOf(tally, rank));
}

export function resultsTitleOf(request: SimulationRequest | null): string {
  if (request?.mode !== 'bulk') return LOTTO_COPY.resultsTitleJackpot;
  return LOTTO_COPY.resultsTitleBulk(formatTickets(request.count));
}
