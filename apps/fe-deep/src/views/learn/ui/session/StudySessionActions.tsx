import { ArrowRight, Eye, RotateCcw, SkipForward } from 'lucide-react';

import { Button } from '@shared/ui/Button';

import { useStudySessionContext } from '../../model/hooks/useStudySessionContext';

export function StudySessionActions() {
  const { isFlipped, isLastStep, handleFlip, handleNext, handleRetry, handleSkip } = useStudySessionContext();

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2.5">
      <Button variant="outline" size="lg" onClick={handleRetry} disabled={!isFlipped} className="gap-2 shadow-sm">
        <RotateCcw className="h-4 w-4" />
        다시 풀기
      </Button>
      <Button size="lg" onClick={isFlipped ? handleNext : handleFlip} className="flex-1 gap-2 shadow-md">
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
      <Button variant="ghost" size="lg" onClick={handleSkip} className="gap-2">
        건너뛰기
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
}
