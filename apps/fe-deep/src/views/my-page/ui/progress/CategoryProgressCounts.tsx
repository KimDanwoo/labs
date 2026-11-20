import { Badge } from '@shared/ui/Badge';

import type { CategoryProgress } from '@views/my-page/model/hooks/useProgressStats';

interface CategoryProgressCountsProps {
  title: string;
  progress: CategoryProgress;
  percent: number;
}

export function CategoryProgressCounts({ title, progress, percent }: CategoryProgressCountsProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-normal truncate">{title}</span>
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
  );
}
