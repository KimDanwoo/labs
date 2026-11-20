import { Card } from '@shared/ui/Card';

import { StudyHeatmap } from './StudyHeatmap';

export function ProgressHeatmap() {
  return (
    <Card className="mb-8 shadow-sm">
      <Card.Content className="p-6">
        <h2 className="text-sm font-normal mb-4">학습 기록</h2>
        <StudyHeatmap />
      </Card.Content>
    </Card>
  );
}
