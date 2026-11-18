import { cn } from '@shared/lib/cn';

import { styles } from './StudyCardView.styles';

interface StepDotsProps {
  stepIndex: number;
  stepCount: number;
}

export function StepDots({ stepIndex, stepCount }: StepDotsProps) {
  return (
    <div className={styles.steps} aria-label={`${stepIndex + 1}단계 / 총 ${stepCount}단계`}>
      {Array.from({ length: stepCount }, (_, index) => (
        <span
          key={index}
          className={cn(styles.stepDot.base, index <= stepIndex ? styles.stepDot.reached : styles.stepDot.upcoming)}
        />
      ))}
    </div>
  );
}
