import type { Category } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { Card } from '@shared/ui/Card';
import { Progress } from '@shared/ui/Progress';

import { toPercent } from '../../lib/toPercent';
import type { CategoryProgress } from '../../model/hooks/useProgressStats';
import { styles } from './ProgressPage.styles';

interface CategoryProgressCardProps {
  category: Category;
  progress: CategoryProgress;
}

export function CategoryProgressCard({ category, progress }: CategoryProgressCardProps) {
  const total = progress.mastered + progress.learning + progress.unseen;
  const percent = toPercent(progress.mastered + progress.learning, total);

  return (
    <Card className={styles.categoryCard}>
      <Card.Content className={styles.categoryContent}>
        <div className={styles.categoryRow}>
          <span className={styles.categoryIcon}>{category.icon}</span>
          <div className={styles.categoryBody}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryName}>{category.title}</span>
              <div className={styles.categoryCounts}>
                <Badge variant="success" className={styles.countBadge}>
                  {progress.mastered}
                </Badge>
                <Badge variant="warning" className={styles.countBadge}>
                  {progress.learning}
                </Badge>
                <span className={styles.categoryPercent}>{percent}%</span>
              </div>
            </div>
            <Progress value={percent} className={styles.categoryBar} />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
