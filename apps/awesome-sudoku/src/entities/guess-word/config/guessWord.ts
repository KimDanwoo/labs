const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const GUESS_WORD_TIME = {
  dayMs: DAY_MS,
  kstOffsetMs: KST_OFFSET_MS,
  firstDayUtcMs: Date.UTC(2026, 10, 25),
  firstPuzzleDay: 1,
} as const;

export const GUESS_WORD_RANK = {
  top: 1000,
  hints: [1, 10, 1000],
} as const;

export const GUESS_WORD_DATA = {
  words: 'words.txt',
  answers: 'answers.txt',
  vectors: 'vectors.bin',
  senses: 'senses.txt',
  senseSeparator: '\t',
  dimensions: 556,
} as const;

export const GUESS_WORD_INPUT = {
  pattern: /^[가-힣]{1,8}$/,
} as const;

export const GUESS_WORD_ALIASES: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^([월화수목금토일])(요일날|욜)$/, replacement: '$1요일' },
];

export const GUESS_WORD_ERROR = {
  INVALID: 'invalid-word',
  UNKNOWN: 'unknown-word',
  BOT: 'bot',
} as const;

export const GUESS_WORD_ERROR_STATUS = {
  [GUESS_WORD_ERROR.INVALID]: 400,
  [GUESS_WORD_ERROR.UNKNOWN]: 404,
  [GUESS_WORD_ERROR.BOT]: 403,
} as const;

export const GUESS_WORD_NO_STORE = { 'Cache-Control': 'no-store' } as const;

export const GUESS_WORD_API = {
  guess: '/api/guess-word',
  hints: '/api/guess-word/hints',
  yesterday: '/api/guess-word/yesterday',
  guessMethod: 'POST',
} as const;
