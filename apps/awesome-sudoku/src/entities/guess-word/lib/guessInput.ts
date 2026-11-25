import { GUESS_WORD_INPUT } from '@entities/guess-word/config/guessWord';

export function normalizeGuess(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, '');
}

export function isValidGuess(word: string): boolean {
  return GUESS_WORD_INPUT.pattern.test(word);
}
