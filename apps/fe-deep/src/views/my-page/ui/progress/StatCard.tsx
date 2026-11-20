import { cn } from '@shared/lib/cn';
import { Card } from '@shared/ui/Card';

import type { StatCardConfig } from '@views/my-page/config/progress';

interface StatCardProps {
  config: StatCardConfig;
  value: number | string;
}

export function StatCard({ config: { label, Icon, tone }, value }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <Card.Content className="p-5 text-center">
        <div
          className={cn(
            'mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full',
            {
              base: 'mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full',
              study: 'bg-study/10',
              success: 'bg-success-subtle',
              warning: 'bg-warning-subtle',
              muted: 'bg-muted',
            }[tone],
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              {
                base: 'h-5 w-5',
                study: 'text-study',
                success: 'text-success',
                warning: 'text-warning',
                muted: 'text-muted-foreground',
              }[tone],
            )}
          />
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </Card.Content>
    </Card>
  );
}
