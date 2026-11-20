import type { Category } from '@entities/question';
import { Card } from '@shared/ui/Card';
import { Progress } from '@shared/ui/Progress';

import { toPercent } from '@views/my-page/lib/toPercent';
import type { CategoryProgress } from '@views/my-page/model/hooks/useProgressStats';
import { CategoryProgressCounts } from '@views/my-page/ui/progress/CategoryProgressCounts';

interface CategoryProgressCardProps {
  category: Category;
  progress: CategoryProgress;
}

export function CategoryProgressCard({ category, progress }: CategoryProgressCardProps) {
  const total = progress.mastered + progress.learning + progress.unseen;
  const percent = toPercent(progress.mastered + progress.learning, total);

  return (
    <Card className="shadow-sm">
      <Card.Content className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">{category.icon}</span>
          <div className="flex-1 min-w-0">
            <CategoryProgressCounts title={category.title} progress={progress} percent={percent} />
            <Progress value={percent} className="h-1.5 mt-2" />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
