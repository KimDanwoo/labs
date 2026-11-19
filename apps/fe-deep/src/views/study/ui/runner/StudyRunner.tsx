'use client';

import { Progress } from '@shared/ui/Progress';

import type { StudyTopic } from '../../lib/studyDoc';
import { useStudyRun } from '../../model/hooks/useStudyRun';
import { StepCard } from '../step/StepCard';
import { RunnerControls } from './RunnerControls';
import { RunnerHeader } from './RunnerHeader';
import { TopicNotes } from './TopicNotes';
import { TopicToc } from './TopicToc';

interface StudyRunnerProps {
  docTitle: string;
  topics: StudyTopic[];
  understood: Set<string>;
  review: Set<string>;
  onToggleUnderstood: (topicTitle: string) => void;
  onToggleReview: (topicTitle: string) => void;
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

  const topicTitle = run.topic.title;

  return (
    <div className="min-w-0">
      <RunnerHeader
        docTitle={docTitle}
        topicTitle={topicTitle}
        topicPosition={run.topicIndex + 1}
        topicCount={topics.length}
        doneSteps={run.doneSteps}
        totalSteps={run.totalSteps}
        toc={
          <TopicToc
            topics={topics}
            activeIndex={run.topicIndex}
            understood={understood}
            review={review}
            onSelect={run.jumpToTopic}
          />
        }
      />

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

      <RunnerControls
        run={run}
        isUnderstood={understood.has(topicTitle)}
        isInReview={review.has(topicTitle)}
        onToggleUnderstood={() => onToggleUnderstood(topicTitle)}
        onToggleReview={() => onToggleReview(topicTitle)}
      />

      {run.topic.notes && <TopicNotes topicTitle={topicTitle} notes={run.topic.notes} />}

      <p className="mt-4 hidden text-xs text-muted-foreground/70 lg:block">
        Space 또는 → 다음 · ← 이전 · ⌘/Ctrl + Enter 답 확인
      </p>
    </div>
  );
}
