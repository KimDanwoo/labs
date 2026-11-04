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
  /** 현재 복습 간격 (일 단위) */
  interval: number;
  /** 연속 정답 횟수 (again 시 0으로 리셋) */
  repetition: number;
  /** 다음 복습 예정일 (ISO date string, e.g. "2026-02-26") */
  next_review: string;
}
