import { BookmarkPlus, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, SkipForward } from 'lucide-react';

import { Button } from '@shared/ui/Button';

import { nextStepLabel } from '../../lib/nextStepLabel';
import type { useStudyRun } from '../../model/hooks/useStudyRun';
import { styles } from './StudyRunner.styles';

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
    <div className={styles.controls}>
      <Button variant="ghost" size="lg" onClick={run.goPrev} disabled={run.isFirstStep} className={styles.stepButton}>
        <ChevronLeft className={styles.icon} />
        이전
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={run.retryStep}
        disabled={!run.isRevealed}
        className={styles.markButton}
      >
        <RotateCcw className={styles.icon} />
        다시 풀기
      </Button>
      <Button size="lg" onClick={run.goNext} disabled={run.isFinished} className={styles.primary}>
        {nextStepLabel(run.isRevealed, run.isLastStep, run.isLastTopic)}
        <ChevronRight className={styles.icon} />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        onClick={run.goNextTopic}
        disabled={run.isLastTopic}
        className={styles.stepButton}
      >
        건너뛰기
        <SkipForward className={styles.icon} />
      </Button>
      <Button
        variant={isUnderstood ? 'secondary' : 'outline'}
        size="lg"
        onClick={onToggleUnderstood}
        aria-pressed={isUnderstood}
        className={styles.markButton}
      >
        <CheckCircle2 className={isUnderstood ? styles.understoodIcon : styles.icon} />
        이해됨
      </Button>
      <Button
        variant={isInReview ? 'secondary' : 'outline'}
        size="lg"
        onClick={onToggleReview}
        aria-pressed={isInReview}
        className={styles.markButton}
      >
        <BookmarkPlus className={isInReview ? styles.reviewIcon : styles.icon} />
        오답노트
      </Button>
    </div>
  );
}
