import type { ReviewRating } from './types';

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
