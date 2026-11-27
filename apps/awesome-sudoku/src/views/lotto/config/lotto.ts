export const LOTTO_MAX_NUMBER = 45;
export const LOTTO_PICK_COUNT = 6;
export const LOTTO_DRAWN_COUNT = LOTTO_PICK_COUNT + 1;
export const TICKET_PRICE = 1_000;
export const TOTAL_COMBINATIONS = 8_145_060;

export const LOTTO_RANKS = [1, 2, 3, 4, 5] as const;
export type LottoRank = (typeof LOTTO_RANKS)[number];

export const RANK_PRIZE: Record<LottoRank, number> = {
  1: 2_000_000_000,
  2: 55_000_000,
  3: 1_500_000,
  4: 50_000,
  5: 5_000,
};

export const RANK_WINNING_COMBINATIONS: Record<LottoRank, number> = {
  1: 1,
  2: 6,
  3: 228,
  4: 11_115,
  5: 182_780,
};

export const RANK_CONDITION: Record<LottoRank, string> = {
  1: '6개 일치',
  2: '5개 + 보너스 일치',
  3: '5개 일치',
  4: '4개 일치',
  5: '3개 일치',
};

export const ASSUMED_PRIZE_RANKS: readonly LottoRank[] = [1, 2, 3];

export const BULK_TICKET_PRESETS = [1_000, 10_000, 100_000, 1_000_000] as const;
export const JACKPOT_TICKET_LIMIT = 100_000_000;
export const SIMULATION_CHUNK_SIZE = 200_000;
