export {
  getCurrentStreak,
  getProgressByCategory,
  getProgressForQuestion,
  getStudyHeatmap,
  updateQuestionProgress,
} from './model/services/progressApi';
export { getLocalProgress } from './model/services/progressStorage';
export { clearUserIdCache, getCurrentUserId, syncProgress } from './model/services/progressSync';
export type { ProgressStatus } from './model/types/types';
