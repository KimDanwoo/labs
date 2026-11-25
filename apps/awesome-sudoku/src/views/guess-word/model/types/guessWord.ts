import type { GUESS_STATUS, NOTICE_KIND, RANK_TONE } from '@views/guess-word/config/game';

export type GuessStatus = (typeof GUESS_STATUS)[keyof typeof GUESS_STATUS];
export type NoticeKind = (typeof NOTICE_KIND)[keyof typeof NOTICE_KIND];
export type RankTone = (typeof RANK_TONE)[keyof typeof RANK_TONE];

export interface GuessEntry {
  word: string;
  similarity: number;
  rank: number | null;
  order: number;
}

export interface GuessRecord {
  day: number;
  guesses: GuessEntry[];
  status: GuessStatus;
  answer: string | null;
}

export interface Notice {
  kind: NoticeKind;
  word: string;
}

export interface RankView {
  tone: RankTone;
  rank: number | null;
  progress: number;
}
