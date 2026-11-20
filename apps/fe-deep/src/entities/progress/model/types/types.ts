import type { PROGRESS_STATUS } from '@entities/progress/model/constants/constants';

export type ProgressStatus = (typeof PROGRESS_STATUS)[keyof typeof PROGRESS_STATUS];

export interface UserProgress {
  question_id: string;
  status: ProgressStatus;
  correct_count: number;
  wrong_count: number;
  last_reviewed: string;
  easiness_factor: number;
  interval: number;
  repetition: number;
  next_review: string;
}
