'use client';

import { Button, MarkdownRenderer, Progress, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui';
import { BookmarkPlus, CheckCircle2, ChevronLeft, ChevronRight, List, RotateCcw, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { useStudyRun, type StudyTopic } from '../model';
import { StepCard } from './StepCard';
import { TopicToc } from './TopicToc';

interface StudyRunnerProps {
  docTitle: string;
  topics: StudyTopic[];
  understood: Set<string>;
  review: Set<string>;
  onToggleUnderstood: (topicTitle: string) => void;
  onToggleReview: (topicTitle: string) => void;
}

function getNextLabel(isRevealed: boolean, isLastStep: boolean, isLastTopic: boolean): string {
  if (!isRevealed) return '답 확인';
  if (!isLastStep) return '다음 단계';
  if (!isLastTopic) return '다음 주제';
  return '마지막';
}

export function StudyRunner({
  docTitle,
  topics,
  understood,
  review,
  onToggleUnderstood,
  onToggleReview,
}: StudyRunnerProps) {
  const run = useStudyRun(topics);

  if (!run.topic || !run.step) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        학습할 내용이 없습니다. 마크다운에 <code>{'# 주제'}</code>와 <code>{'## 30초 답변'}</code>을 넣어주세요.
      </div>
    );
  }

  const currentTopic = run.topic;
  const isUnderstood = understood.has(currentTopic.title);
  const isInReview = review.has(currentTopic.title);
  const toc = (
    <TopicToc
      topics={topics}
      activeIndex={run.topicIndex}
      understood={understood}
      review={review}
      onSelect={run.jumpToTopic}
    />
  );

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="주제 목차 열기" className="shrink-0">
              <List className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto p-0">
            <SheetTitle className="sr-only">주제 목차</SheetTitle>
            <div className="pt-8">{toc}</div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <Link href="/study" className="text-xs text-muted-foreground hover:text-foreground">
            {docTitle}
          </Link>
          <p className="truncate text-sm font-medium">
            <span className="tabular-nums text-muted-foreground">
              {run.topicIndex + 1}/{topics.length}
            </span>{' '}
            {run.topic.title}
          </p>
        </div>

        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {run.doneSteps}/{run.totalSteps}
        </span>
      </div>

      <Progress value={run.progressPercent} className="mb-6 h-1.5" />

      <StepCard
        step={run.step}
        stepIndex={run.stepIndex}
        stepCount={run.stepCount}
        isRevealed={run.isRevealed}
        recall={run.recall}
        onRecallChange={run.setRecall}
        onReveal={run.reveal}
      />

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
          {getNextLabel(run.isRevealed, run.isLastStep, run.isLastTopic)}
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="lg" onClick={run.goNextTopic} disabled={run.isLastTopic} className="gap-1">
          건너뛰기
          <SkipForward className="size-4" />
        </Button>
        <Button
          variant={isUnderstood ? 'secondary' : 'outline'}
          size="lg"
          onClick={() => onToggleUnderstood(currentTopic.title)}
          aria-pressed={isUnderstood}
          className="gap-1.5"
        >
          <CheckCircle2 className={isUnderstood ? 'size-4 text-primary' : 'size-4'} />
          이해됨
        </Button>
        <Button
          variant={isInReview ? 'secondary' : 'outline'}
          size="lg"
          onClick={() => onToggleReview(currentTopic.title)}
          aria-pressed={isInReview}
          className="gap-1.5"
        >
          <BookmarkPlus className={isInReview ? 'size-4 text-warning' : 'size-4'} />
          오답노트
        </Button>
      </div>

      {run.topic.notes && (
        <details className="mt-6 rounded-xl border border-border/60">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
            참고 자료 — {run.topic.title}
          </summary>
          <div className="border-t border-border/60 px-4 py-4">
            <MarkdownRenderer content={run.topic.notes} />
          </div>
        </details>
      )}

      <p className="mt-4 hidden text-xs text-muted-foreground/70 lg:block">
        Space 또는 → 다음 · ← 이전 · ⌘/Ctrl + Enter 답 확인
      </p>
    </div>
  );
}
