import { cn } from '@shared/lib/cn';

import { styles } from './StepDots.styles';

interface StepDotsProps {
  stepIndex: number;
  stepCount: number;
}

export function StepDots({ stepIndex, stepCount }: StepDotsProps) {
  return (
    <div className="ml-auto flex items-center gap-1.5" aria-label={`${stepIndex + 1}단계 / 총 ${stepCount}단계`}>
      {Array.from({ length: stepCount }, (_, index) => (
        <span
          key={index}
          className={cn(styles.dot.base, index <= stepIndex ? styles.dot.reached : styles.dot.upcoming)}
        />
      ))}
    </div>
  );
}
