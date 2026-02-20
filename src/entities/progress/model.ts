import type { Question } from '@/entities/question/model';

export type ProgressStatus = 'unseen' | 'learning' | 'mastered';

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  status: ProgressStatus;
  correct_count: number;
  wrong_count: number;
  last_reviewed: string;
}

export interface DailyStreak {
  id: string;
  user_id: string;
  date: string;
  questions_solved: number;
}

export interface FlashcardSession {
  questions: Question[];
  currentIndex: number;
  results: FlashcardResult[];
}

export interface FlashcardResult {
  questionId: string;
  knew: boolean;
}
