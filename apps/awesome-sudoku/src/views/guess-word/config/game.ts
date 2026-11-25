export const GUESS_STATUS = {
  PLAYING: 'playing',
  SOLVED: 'solved',
} as const;

export const NOTICE_KIND = {
  INVALID: 'invalid',
  UNKNOWN: 'unknown',
  DUPLICATE: 'duplicate',
  NETWORK: 'network',
  BOT: 'bot',
} as const;

export const RANK_TONE = {
  ANSWER: 'answer',
  RANKED: 'ranked',
  FAR: 'far',
} as const;

export const GUESS_STORAGE_KEY = 'awesome-sudoku:guess-word';

export const GUESS_QUERY_KEY = {
  hints: (day: number | null) => ['guess-word', 'hints', day] as const,
  yesterday: (day: number | null) => ['guess-word', 'yesterday', day] as const,
};
