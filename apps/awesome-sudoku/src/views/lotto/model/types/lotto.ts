import type { LottoRank } from '@views/lotto/config/lotto';

export interface LottoDraw {
  numbers: readonly number[];
  bonus: number;
}

export type RankCounts = Record<LottoRank, number>;

export interface Tally {
  tickets: number;
  counts: RankCounts;
}

export type SimulationRequest =
  | { mode: 'bulk'; ticket: readonly number[]; count: number }
  | { mode: 'jackpot'; ticket: readonly number[]; limit: number };

export type SimulationMode = SimulationRequest['mode'];

export interface SimulationResult {
  tally: Tally;
  hasJackpot: boolean;
}

export type SimulationStatus = 'idle' | 'running' | 'done' | 'cancelled';
