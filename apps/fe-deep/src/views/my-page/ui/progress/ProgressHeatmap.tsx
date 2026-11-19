import { Card } from '@shared/ui/Card';

import { useProgressStatsContext } from '../../model/hooks/useProgressStatsContext';
import { StudyHeatmap } from './StudyHeatmap';

export function ProgressHeatmap() {
  const { heatmap } = useProgressStatsContext();

  return (
    <Card className="mb-8 shadow-sm">
      <Card.Content className="p-6">
        <h2 className="text-sm font-normal mb-4">학습 기록</h2>
        <StudyHeatmap heatmap={heatmap} />
      </Card.Content>
    </Card>
  );
}
