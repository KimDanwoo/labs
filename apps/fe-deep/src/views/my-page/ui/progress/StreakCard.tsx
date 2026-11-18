import { Flame } from 'lucide-react';

import { Card } from '@shared/ui/Card';

import { styles } from './ProgressPage.styles';

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  return (
    <Card className={styles.streakCard}>
      <Card.Content className={styles.streakContent}>
        <div className={styles.streakIcon}>
          <Flame className={styles.streakFlame} />
        </div>
        <div>
          <div className={styles.streakValue}>{streak}일</div>
          <div className={styles.caption}>연속 학습</div>
        </div>
      </Card.Content>
    </Card>
  );
}
