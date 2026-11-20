import type { Category } from '@entities/question';

import { CategoryHeading } from '@views/reference/ui/detail/CategoryHeading';
import { MobileCategoryMenu } from '@views/reference/ui/detail/MobileCategoryMenu';

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
