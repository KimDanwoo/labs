export interface Category {
  id: string;
  slug: string;
  title: string;
  order_num: number;
  icon: string;
  description: string;
  question_count: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type FollowUp = {
  question: string;
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

export interface QuestionContent {
  categories: Category[];
  questions: Question[];
}

export interface SearchResult {
  question: Question;
  category: Category;
  matchType: 'question' | 'answer' | 'tag';
}
