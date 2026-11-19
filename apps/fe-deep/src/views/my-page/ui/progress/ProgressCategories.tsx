import { EMPTY_CATEGORY_STATS } from '../../config/progress';
import { useProgressStatsContext } from '../../model/hooks/useProgressStatsContext';
import { CategoryProgressCard } from './CategoryProgressCard';

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
