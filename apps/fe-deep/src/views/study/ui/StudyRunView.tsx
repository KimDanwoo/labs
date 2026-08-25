'use client';

import { Button, MarkdownRenderer, Progress, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui';
import { ChevronLeft, ChevronRight, List, RotateCcw, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { useStudyRun, type StudyDoc } from '../model';
import { StepCard } from './StepCard';
import { TopicToc } from './TopicToc';

interface StudyRunViewProps {
  doc: StudyDoc;
}

function getNextLabel(isRevealed: boolean, isLastStep: boolean, isLastTopic: boolean): string {
  if (!isRevealed) return '답 확인';
  if (!isLastStep) return '다음 단계';
  if (!isLastTopic) return '다음 주제';
  return '마지막';
}

export function StudyRunView({ doc }: StudyRunViewProps) {
  const run = useStudyRun(doc.topics);

  if (!run.topic || !run.step) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        학습할 내용이 없습니다. 마크다운에 <code>{'# 주제'}</code>와 <code>{'## 30초 답변'}</code>을 넣어주세요.
      </div>
    );
  }

  const toc = <TopicToc topics={doc.topics} activeIndex={run.topicIndex} onSelect={run.jumpToTopic} />;

  return (
    <div className="flex gap-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-border/60 shadow-sm">
          {toc}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
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
              {doc.title}
            </Link>
            <p className="truncate text-sm font-medium">
              <span className="tabular-nums text-muted-foreground">
                {run.topicIndex + 1}/{doc.topics.length}
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
          {run.isRevealed && (
            <Button variant="outline" size="lg" onClick={run.retryStep} className="gap-1.5">
              <RotateCcw className="size-4" />
              다시 풀기
            </Button>
          )}
          <Button size="lg" onClick={run.goNext} disabled={run.isFinished} className="flex-1 gap-1">
            {getNextLabel(run.isRevealed, run.isLastStep, run.isLastTopic)}
            <ChevronRight className="size-4" />
          </Button>
          {!run.isLastTopic && (
            <Button variant="ghost" size="lg" onClick={run.goNextTopic} className="gap-1">
              다음 주제
              <SkipForward className="size-4" />
            </Button>
          )}
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
    </div>
  );
}
