import { EMPTY_CATEGORY_STATS } from '@views/my-page/config/progress';
import { useProgressStatsContext } from '@views/my-page/model/hooks/useProgressStatsContext';
import { CategoryProgressCard } from '@views/my-page/ui/progress/CategoryProgressCard';

export function ProgressCategories() {
  const { categories, categoryStats } = useProgressStatsContext();

  return (
    <>
      <h2 className="text-xl font-bold tracking-tight mb-4">카테고리별 진도</h2>
      <div className="space-y-3">
        {categories.map((category) => (
          <CategoryProgressCard
            key={category.id}
            category={category}
            progress={categoryStats[category.id] ?? EMPTY_CATEGORY_STATS}
          />
        ))}
      </div>
    </>
  );
}
