export const SM2_CONSTANTS = {
  INTERVAL_FIRST_REPETITION: 1,
  INTERVAL_SECOND_REPETITION: 6,
  STREAK_LOOKBACK_DAYS: 365,
} as const;

export const PROGRESS_STATUS = { unseen: 'unseen', learning: 'learning', mastered: 'mastered' } as const;
