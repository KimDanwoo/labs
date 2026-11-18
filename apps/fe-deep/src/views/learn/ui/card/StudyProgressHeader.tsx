import type { ReactNode } from 'react';

import { Badge } from '@shared/ui/Badge';
import { Progress } from '@shared/ui/Progress';

import { styles } from './StudyCardView.styles';

interface StudyProgressHeaderProps {
  currentIndex: number;
  totalCount: number;
  isNewCard: boolean;
  isFlipped: boolean;
  progressPercent: number;
  action?: ReactNode;
}

export function StudyProgressHeader({
  currentIndex,
  totalCount,
  isNewCard,
  isFlipped,
  progressPercent,
  action,
}: StudyProgressHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.headerGroup}>
          <span className={styles.counter}>
            {currentIndex + 1} / {totalCount}
          </span>
          {isNewCard && (
            <Badge variant="secondary" className={styles.badge}>
              NEW
            </Badge>
          )}
        </div>
        <div className={styles.headerGroup}>
          {!isFlipped && <span className={styles.shortcutHint}>Space 또는 ⌘/Ctrl+Enter</span>}
          {isFlipped && <span className={styles.shortcutHint}>Space/Enter로 다음</span>}
          {action}
        </div>
      </div>
      <Progress value={progressPercent} className={styles.progress} />
    </div>
  );
}
