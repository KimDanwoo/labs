import { Card } from '@shared/ui/Card';
import { Progress } from '@shared/ui/Progress';

import { NOT_LOADED } from '../../config/progress';

interface OverallProgressCardProps {
  isLoaded: boolean;
  percent: number;
}

export function OverallProgressCard({ isLoaded, percent }: OverallProgressCardProps) {
  return (
    <Card className="mb-8 shadow-sm">
      <Card.Content className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-normal">전체 진도</span>
          <span className="text-sm font-normal tabular-nums text-primary">{isLoaded ? `${percent}%` : NOT_LOADED}</span>
        </div>
        <Progress value={percent} className="h-2" />
      </Card.Content>
    </Card>
  );
}
