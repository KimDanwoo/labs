import { Card } from '@shared/ui/Card';
import { Progress } from '@shared/ui/Progress';

import { NOT_LOADED } from '@views/my-page/config/progress';
import { useProgressStatsContext } from '@views/my-page/model/hooks/useProgressStatsContext';

export function ProgressOverall() {
  const { stats, overallPercent } = useProgressStatsContext();

  return (
    <Card className="mb-8 shadow-sm">
      <Card.Content className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-normal">전체 진도</span>
          <span className="text-sm font-normal tabular-nums text-primary">
            {stats ? `${overallPercent}%` : NOT_LOADED}
          </span>
        </div>
        <Progress value={overallPercent} className="h-2" />
      </Card.Content>
    </Card>
  );
}
