import { ArrowRight, Eye, RotateCcw, SkipForward } from 'lucide-react';

import { Button } from '@shared/ui/Button';

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
    <div className="mt-5 flex flex-wrap items-center gap-2.5">
      <Button variant="outline" size="lg" onClick={onRetry} disabled={!isFlipped} className="gap-2 shadow-sm">
        <RotateCcw className="h-4 w-4" />
        다시 풀기
      </Button>
      <Button size="lg" onClick={isFlipped ? onNext : onFlip} className="flex-1 gap-2 shadow-md">
        {isFlipped ? (
          <>
            {isLastStep ? '다음' : '꼬꼬무'}
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            답변 확인
          </>
        )}
      </Button>
      <Button variant="ghost" size="lg" onClick={onSkip} className="gap-2">
        건너뛰기
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
}
