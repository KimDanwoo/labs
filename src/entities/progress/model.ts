export type ProgressStatus = 'unseen' | 'learning' | 'mastered';

/** SM-2 자기 평가 등급. Anki 스타일 4단계. */
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  status: ProgressStatus;
  correct_count: number;
  wrong_count: number;
  last_reviewed: string;
  /** SM-2 easiness factor (1.3 이상, 초기값 2.5) */
  easiness_factor: number;
  /** 현재 복습 간격 (일 단위) */
  interval: number;
  /** 연속 정답 횟수 (again 시 0으로 리셋) */
  repetition: number;
  /** 다음 복습 예정일 (ISO date string, e.g. "2026-02-26") */
  next_review: string;
}

export interface DailyStreak {
  id: string;
  user_id: string;
  date: string;
  questions_solved: number;
}

export interface FlashcardResult {
  questionId: string;
  rating: ReviewRating;
}

/** SM-2 알고리즘 계산 결과 */
export interface SM2Result {
  easiness_factor: number;
  interval: number;
  repetition: number;
  next_review: string;
}

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
