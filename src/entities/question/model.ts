export interface Category {
  id: string;
  slug: string;
  title: string;
  order_num: number;
  icon: string;
  description: string;
  question_count?: number;
}

export interface Question {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sub_category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order_num: number;
  tags: string[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
}

export interface QuestionWithCategory extends Question {
  category: Category;
}

export interface QuestionInput {
  question: string;
  answer: string;
  category_id: string;
  sub_category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  order_num?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResult {
  question: Question;
  category: Category;
  matchType: 'question' | 'answer' | 'tag';
}
