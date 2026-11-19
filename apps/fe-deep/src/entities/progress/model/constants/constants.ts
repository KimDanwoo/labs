export const SM2_CONSTANTS = {
  INTERVAL_FIRST_REPETITION: 1,
  INTERVAL_SECOND_REPETITION: 6,
  STREAK_LOOKBACK_DAYS: 365,
  DEFAULT_EASINESS_FACTOR: 2.5,
  MASTERED_REPETITION: 2,
} as const;

export const PROGRESS_STATUS = { unseen: 'unseen', learning: 'learning', mastered: 'mastered' } as const;

export const DATE_PART_LENGTH = 2;

export const MASTERED_CORRECT_STREAK = 3;
