export {
  GUESS_WORD_API,
  GUESS_WORD_ERROR,
  GUESS_WORD_ERROR_STATUS,
  GUESS_WORD_NO_STORE,
  GUESS_WORD_RANK,
} from '@entities/guess-word/config/guessWord';
export { isValidGuess, normalizeGuess } from '@entities/guess-word/lib/guessInput';
export type {
  AnswerResult,
  GuessErrorBody,
  GuessResult,
  GuessWordError,
  HintsResult,
  RankHint,
} from '@entities/guess-word/model/types/guessWord';
