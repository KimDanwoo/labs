import type { RankHint } from '@entities/guess-word';
import { HINT_RANKS } from '@views/guess-word/config/game';

export interface HintCell {
  rank: number;
  value: string | null;
}

const SIMILARITY_DIGITS = 2;

export function hintCellsOf(hints: RankHint[] | undefined): HintCell[] {
  if (!hints) return HINT_RANKS.map((rank) => ({ rank, value: null }));
  return hints.map(({ rank, similarity }) => ({ rank, value: similarity.toFixed(SIMILARITY_DIGITS) }));
}
