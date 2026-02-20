export type { Category, Question, QuizOption, QuestionWithCategory, SearchResult } from './model';
export {
  getAllCategories,
  getCategoryBySlug,
  getQuestionsByCategory,
  getQuestionsByCategorySlug,
  getQuestionById,
  getQuestionsByIds,
  getAllQuestions,
  searchQuestions,
  getQuestionsByDifficulty,
  getRandomQuestions,
} from './api';
