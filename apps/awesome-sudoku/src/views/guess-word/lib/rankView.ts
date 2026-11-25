import { GUESS_WORD_RANK } from '@entities/guess-word';
import { RANK_TONE } from '@views/guess-word/config/game';
import type { GuessEntry, RankView } from '@views/guess-word/model/types/guessWord';

const FULL = 1;
const EMPTY = 0;

export function rankView(entry: GuessEntry, answer: string | null): RankView {
  if (entry.word === answer) return { tone: RANK_TONE.ANSWER, rank: null, progress: FULL };
  if (entry.rank === null) return { tone: RANK_TONE.FAR, rank: null, progress: EMPTY };
  const progress = (GUESS_WORD_RANK.top + 1 - entry.rank) / GUESS_WORD_RANK.top;
  return { tone: RANK_TONE.RANKED, rank: entry.rank, progress };
}
