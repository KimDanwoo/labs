import { getAllQuestions, getQuestionsByCategorySlug, type Category, type Question } from '@entities/question';
import { shuffleArray } from '@shared/lib/shuffle';
import { ALL_CATEGORIES, STUDY_ORDER, type StudySettings } from '../model/constants/study';

/** 설정에 맞는 질문을 학습할 순서대로 돌려준다. 순서대로 = 카테고리 순서 → 카테고리 안 순서. */
export async function loadStudyQuestions(
  { categorySlug, order, difficulties }: StudySettings,
  categories: Category[],
): Promise<Question[]> {
  const loaded =
    categorySlug === ALL_CATEGORIES ? await getAllQuestions() : await getQuestionsByCategorySlug(categorySlug);
  const matching =
    difficulties.length > 0 ? loaded.filter((question) => difficulties.includes(question.difficulty)) : loaded;

  if (order === STUDY_ORDER.random) return shuffleArray(matching);

  const categoryOrder = new Map(categories.map((category) => [category.id, category.order_num]));
  return [...matching].sort(
    (a, b) =>
      (categoryOrder.get(a.category_id) ?? 0) - (categoryOrder.get(b.category_id) ?? 0) || a.order_num - b.order_num,
  );
}
