import { BookmarkPlus, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, SkipForward } from 'lucide-react';

import { Button } from '@shared/ui/Button';

import { nextStepLabel } from '../../lib/nextStepLabel';
import type { useStudyRun } from '../../model/hooks/useStudyRun';

interface RunnerControlsProps {
  run: ReturnType<typeof useStudyRun>;
  isUnderstood: boolean;
  isInReview: boolean;
  onToggleUnderstood: () => void;
  onToggleReview: () => void;
}

export function RunnerControls({
  run,
  isUnderstood,
  isInReview,
  onToggleUnderstood,
  onToggleReview,
}: RunnerControlsProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="lg" onClick={run.goPrev} disabled={run.isFirstStep} className="gap-1">
        <ChevronLeft className="size-4" />
        이전
      </Button>
      <Button variant="outline" size="lg" onClick={run.retryStep} disabled={!run.isRevealed} className="gap-1.5">
        <RotateCcw className="size-4" />
        다시 풀기
      </Button>
      <Button size="lg" onClick={run.goNext} disabled={run.isFinished} className="flex-1 gap-1">
        {nextStepLabel(run.isRevealed, run.isLastStep, run.isLastTopic)}
        <ChevronRight className="size-4" />
      </Button>
      <Button variant="ghost" size="lg" onClick={run.goNextTopic} disabled={run.isLastTopic} className="gap-1">
        건너뛰기
        <SkipForward className="size-4" />
      </Button>
      <Button
        variant={isUnderstood ? 'secondary' : 'outline'}
        size="lg"
        onClick={onToggleUnderstood}
        aria-pressed={isUnderstood}
        className="gap-1.5"
      >
        <CheckCircle2 className={isUnderstood ? 'size-4 text-primary' : 'size-4'} />
        이해됨
      </Button>
      <Button
        variant={isInReview ? 'secondary' : 'outline'}
        size="lg"
        onClick={onToggleReview}
        aria-pressed={isInReview}
        className="gap-1.5"
      >
        <BookmarkPlus className={isInReview ? 'size-4 text-warning' : 'size-4'} />
        오답노트
      </Button>
    </div>
  );
}
