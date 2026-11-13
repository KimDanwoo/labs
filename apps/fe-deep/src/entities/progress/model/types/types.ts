export type ProgressStatus = 'unseen' | 'learning' | 'mastered';

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
  interval: number;
  repetition: number;
  next_review: string;
}
