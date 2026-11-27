import {
  LOTTO_RANKS,
  RANK_PRIZE,
  RANK_WINNING_COMBINATIONS,
  TICKET_PRICE,
  TOTAL_COMBINATIONS,
  type LottoRank,
} from '@views/lotto/config/lotto';
import type { Tally } from '@views/lotto/model/types/lotto';

export const createEmptyTally = (): Tally => ({ tickets: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });

export const mergeTally = (base: Tally, extra: Tally): Tally => ({
  tickets: base.tickets + extra.tickets,
  counts: {
    1: base.counts[1] + extra.counts[1],
    2: base.counts[2] + extra.counts[2],
    3: base.counts[3] + extra.counts[3],
    4: base.counts[4] + extra.counts[4],
    5: base.counts[5] + extra.counts[5],
  },
});

export const spentOf = (tally: Tally): number => tally.tickets * TICKET_PRICE;

export const wonOf = (tally: Tally): number =>
  LOTTO_RANKS.reduce((sum, rank) => sum + tally.counts[rank] * RANK_PRIZE[rank], 0);

export const returnRateOf = (tally: Tally): number => {
  const spent = spentOf(tally);
  if (spent === 0) return 0;
  return wonOf(tally) / spent;
};

export const theoreticalOddsOf = (rank: LottoRank): number => RANK_WINNING_COMBINATIONS[rank] / TOTAL_COMBINATIONS;

export const observedOddsOf = (tally: Tally, rank: LottoRank): number => {
  if (tally.tickets === 0) return 0;
  return tally.counts[rank] / tally.tickets;
};

export const winningTicketsOf = (tally: Tally): number =>
  LOTTO_RANKS.reduce((sum, rank) => sum + tally.counts[rank], 0);
