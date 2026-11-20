import { loadQuestionContent } from '@entities/question/index.server';

import { CategoryChip } from '@views/home/ui/categories/CategoryChip';

export async function HomeCategories() {
  const { categories } = await loadQuestionContent();

  return (
    <section className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-2">학습 카테고리</h2>
        <p className="text-sm text-muted-foreground">관심 있는 주제를 선택해 학습을 시작하세요</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5 stagger-children">
        {categories.map((category) => (
          <CategoryChip key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
