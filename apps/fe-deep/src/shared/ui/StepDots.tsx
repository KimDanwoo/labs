import { cn } from '@shared/lib/cn';

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
          className={cn(
            'size-1.5 rounded-full transition-colors',
            index <= stepIndex ? 'bg-primary' : 'bg-muted-foreground/25',
          )}
        />
      ))}
    </div>
  );
}
