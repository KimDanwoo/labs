import type { GUESS_WORD_ERROR } from '@entities/guess-word/config/guessWord';

export type GuessWordError = (typeof GUESS_WORD_ERROR)[keyof typeof GUESS_WORD_ERROR];

export interface GuessResult {
  day: number;
  word: string;
  similarity: number;
  rank: number | null;
  isAnswer: boolean;
}

export interface GuessErrorBody {
  day: number;
  error: GuessWordError;
}

export interface RankHint {
  rank: number;
  similarity: number;
}

export interface HintsResult {
  day: number;
  hints: RankHint[];
}

export interface AnswerResult {
  day: number;
  word: string;
}
