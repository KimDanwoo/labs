import { Flame } from 'lucide-react';

import { Card } from '@shared/ui/Card';

import { useProgressStatsContext } from '@views/my-page/model/hooks/useProgressStatsContext';

export function ProgressStreak() {
  const { streak } = useProgressStatsContext();

  return (
    <Card className="shadow-sm mb-6">
      <Card.Content className="p-5 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-streak/10">
          <Flame className="h-6 w-6 text-streak" />
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">{streak}일</div>
          <div className="text-xs text-muted-foreground">연속 학습</div>
        </div>
      </Card.Content>
    </Card>
  );
}
