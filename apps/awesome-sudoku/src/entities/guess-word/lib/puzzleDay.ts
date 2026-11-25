import { GUESS_WORD_TIME } from '@entities/guess-word/config/guessWord';

export function puzzleDay(now: Date): number {
  const kstDay = Math.floor((now.getTime() + GUESS_WORD_TIME.kstOffsetMs) / GUESS_WORD_TIME.dayMs);
  const firstDay = Math.floor(GUESS_WORD_TIME.firstDayUtcMs / GUESS_WORD_TIME.dayMs);
  return kstDay - firstDay + 1;
}

export function answerIndex(day: number, answerCount: number): number {
  const offset = (day - 1) % answerCount;
  return offset < 0 ? offset + answerCount : offset;
}
