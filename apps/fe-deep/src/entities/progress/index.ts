export { clearUserIdCache, getCurrentUserId, syncProgress } from './api/progressSync';
export {
  getCurrentStreak,
  getProgressByCategory,
  getProgressForQuestion,
  getStudyHeatmap,
  markQuestionMastered,
  updateQuestionProgress,
} from './model/services/progressApi';
export { getLocalProgress } from './model/services/progressStorage';
export type { ProgressStatus } from './model/types/types';
