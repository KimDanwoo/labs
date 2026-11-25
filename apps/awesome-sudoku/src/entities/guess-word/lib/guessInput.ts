import { GUESS_WORD_ALIASES, GUESS_WORD_INPUT } from '@entities/guess-word/config/guessWord';

function applyAliases(word: string): string {
  return GUESS_WORD_ALIASES.reduce((current, { pattern, replacement }) => current.replace(pattern, replacement), word);
}

export function normalizeGuess(raw: string): string {
  return applyAliases(raw.normalize('NFC').replace(/\s+/g, ''));
}

export function readGuessWord(body: unknown): string {
  const hasWord = typeof body === 'object' && body !== null && 'word' in body && typeof body.word === 'string';
  return hasWord ? String(body.word) : '';
}

export function isValidGuess(word: string): boolean {
  return GUESS_WORD_INPUT.pattern.test(word);
}
