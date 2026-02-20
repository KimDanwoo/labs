export type { ProgressStatus, UserProgress, DailyStreak, FlashcardSession, FlashcardResult } from './model';
export {
  getLocalProgress,
  saveLocalProgress,
  updateQuestionProgress,
  getProgressForQuestion,
  getProgressStats,
  getProgressByCategory,
  processFlashcardResults,
} from './api';
