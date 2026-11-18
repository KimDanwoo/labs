import type { Category } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { Card } from '@shared/ui/Card';
import { Progress } from '@shared/ui/Progress';

import { toPercent } from '../../lib/toPercent';
import type { CategoryProgress } from '../../model/hooks/useProgressStats';

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
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal truncate">{category.title}</span>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <Badge variant="success" className="tabular-nums">
                  {progress.mastered}
                </Badge>
                <Badge variant="warning" className="tabular-nums">
                  {progress.learning}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">{percent}%</span>
              </div>
            </div>
            <Progress value={percent} className="h-1.5 mt-2" />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
