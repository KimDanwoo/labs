import { Card } from '@shared/ui/Card';
import { Progress } from '@shared/ui/Progress';

import { NOT_LOADED } from '../../config/progress';
import { styles } from './ProgressPage.styles';

interface OverallProgressCardProps {
  isLoaded: boolean;
  percent: number;
}

export function OverallProgressCard({ isLoaded, percent }: OverallProgressCardProps) {
  return (
    <Card className={styles.overallCard}>
      <Card.Content className={styles.cardContent}>
        <div className={styles.overallRow}>
          <span className={styles.overallLabel}>전체 진도</span>
          <span className={styles.overallValue}>{isLoaded ? `${percent}%` : NOT_LOADED}</span>
        </div>
        <Progress value={percent} className={styles.overallBar} />
      </Card.Content>
    </Card>
  );
}
