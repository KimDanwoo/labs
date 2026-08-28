export interface Category {
  id: string;
  slug: string;
  title: string;
  order_num: number;
  icon: string;
  description: string;
  question_count?: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type VisibilityFilter = 'daily' | 'flashcard';

export type QuestionVisibilityField = 'show_in_daily' | 'show_in_flashcard';

/** 답 확인 후 이어서 묻는 꼬리질문(꼬꼬무). */
export type FollowUp = {
  question: string;
  /** 답을 떠올릴 때 쓰는 힌트. 답변 후 언급 여부를 체크한다. */
  keywords: string[];
  answer: string;
};

export interface Question {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sub_category: string;
  difficulty: Difficulty;
  order_num: number;
  tags: string[];
  show_in_daily: boolean;
  show_in_flashcard: boolean;
  follow_ups: FollowUp[];
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
  difficulty: Difficulty;
  tags: string[];
  order_num?: number;
  show_in_daily?: boolean;
  show_in_flashcard?: boolean;
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
