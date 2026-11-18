import { ArrowRight, Eye, RotateCcw, SkipForward } from 'lucide-react';

import { Button } from '@shared/ui/Button';

import { styles } from './StudyCardView.styles';

interface StudyActionsProps {
  isFlipped: boolean;
  isLastStep: boolean;
  onFlip: () => void;
  onNext: () => void;
  onRetry: () => void;
  onSkip: () => void;
}

export function StudyActions({ isFlipped, isLastStep, onFlip, onNext, onRetry, onSkip }: StudyActionsProps) {
  return (
    <div className={styles.actions}>
      <Button variant="outline" size="lg" onClick={onRetry} disabled={!isFlipped} className={styles.retry}>
        <RotateCcw className={styles.actionIcon} />
        다시 풀기
      </Button>
      <Button size="lg" onClick={isFlipped ? onNext : onFlip} className={styles.primaryAction}>
        {isFlipped ? (
          <>
            {isLastStep ? '다음' : '꼬꼬무'}
            <ArrowRight className={styles.actionIcon} />
          </>
        ) : (
          <>
            <Eye className={styles.actionIcon} />
            답변 확인
          </>
        )}
      </Button>
      <Button variant="ghost" size="lg" onClick={onSkip} className={styles.skip}>
        건너뛰기
        <SkipForward className={styles.actionIcon} />
      </Button>
    </div>
  );
}
