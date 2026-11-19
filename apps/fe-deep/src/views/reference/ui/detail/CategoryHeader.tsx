import type { Category } from '@entities/question';

import { CategoryHeading } from './CategoryHeading';
import { MobileCategoryMenu } from './MobileCategoryMenu';

interface CategoryHeaderProps {
  category: Category;
  categories: Category[];
  questionCount: number;
}

export function CategoryHeader({ category, categories, questionCount }: CategoryHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-8">
      <MobileCategoryMenu categories={categories} />
      <CategoryHeading category={category} questionCount={questionCount} />
    </div>
  );
}
