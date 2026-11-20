import { loadQuestionContent } from '@entities/question/index.server';

import { CategoryCard } from '@views/reference/ui/overview/CategoryCard';

export async function CategoryGrid() {
  const { categories } = await loadQuestionContent();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category, index) => (
        <CategoryCard key={category.id} category={category} order={index} />
      ))}
    </div>
  );
}
