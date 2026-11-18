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
    <Card className={styles.statCard}>
      <Card.Content className={styles.statContent}>
        <div className={cn(styles.statIcon.base, styles.statIcon[tone])}>
          <Icon className={cn(styles.statGlyph.base, styles.statGlyph[tone])} />
        </div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </Card.Content>
    </Card>
  );
}
