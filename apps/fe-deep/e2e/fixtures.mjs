export const CATEGORY = {
  id: 'cat-1',
  slug: 'javascript',
  title: 'JavaScript',
  order_num: 1,
  icon: 'JS',
  description: 'JavaScript 학습',
  questions: [{ count: 1 }],
};

export const QUESTION = {
  id: 'q-1',
  category_id: CATEGORY.id,
  question: 'JavaScript는 무엇인가요?',
  answer: '프로그래밍 언어입니다.',
  sub_category: '기초',
  difficulty: 'easy',
  order_num: 1,
  tags: ['JavaScript'],
  show_in_daily: true,
  show_in_flashcard: true,
  follow_ups: [],
  categories: CATEGORY,
};
