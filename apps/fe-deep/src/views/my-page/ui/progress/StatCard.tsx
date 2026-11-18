import { cn } from '@shared/lib/cn';
import { Card } from '@shared/ui/Card';

import type { StatCardConfig } from '../../config/progress';
import { styles } from './ProgressPage.styles';

interface StatCardProps {
  config: StatCardConfig;
  value: number | string;
}

export function StatCard({ config: { label, Icon, tone }, value }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <Card.Content className="p-5 text-center">
        <div className={cn(styles.statIcon.base, styles.statIcon[tone])}>
          <Icon className={cn(styles.statGlyph.base, styles.statGlyph[tone])} />
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </Card.Content>
    </Card>
  );
}
