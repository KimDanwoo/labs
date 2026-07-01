import type { ReviewRating } from './types';

export const SM2_CONSTANTS = {
  MIN_EASINESS_FACTOR: 1.3,
  DEFAULT_EASINESS_FACTOR: 2.5,
  EF_DECREASE: 0.2,
  INTERVAL_FIRST_REPETITION: 1,
  INTERVAL_SECOND_REPETITION: 6,
  HARD_INTERVAL_MULTIPLIER: 1.2,
  EASY_INTERVAL_MULTIPLIER: 1.3,
  JITTER_RANGE: 0.1,
  MASTERED_REPETITION_THRESHOLD: 3,
  STREAK_LOOKBACK_DAYS: 365,
  DAILY_CLEANUP_DAYS: 7,
} as const;

/** 평가 버튼 설정. 플래시카드·데일리 공통. */
export const RATING_CONFIG: {
  rating: ReviewRating;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  { rating: 'again', label: '모르겠음', color: 'text-red-500', bgColor: 'border-red-500/30 hover:bg-red-500/10' },
  { rating: 'hard', label: '어려움', color: 'text-orange-500', bgColor: 'border-orange-500/30 hover:bg-orange-500/10' },
  { rating: 'good', label: '알겠음', color: 'text-green-500', bgColor: 'border-green-500/30 hover:bg-green-500/10' },
  { rating: 'easy', label: '쉬움', color: 'text-blue-500', bgColor: 'border-blue-500/30 hover:bg-blue-500/10' },
];
