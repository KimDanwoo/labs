'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StudyTopic } from './parseHandbook';

/** 입력 중이거나 버튼에 포커스가 있을 땐 단축키를 가로채지 않는다. */
const SKIP_SHORTCUT_TAGS = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'];

export function useStudyRun(topics: StudyTopic[]) {
  const [topicIndex, setTopicIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [recall, setRecall] = useState('');

  const topic = topics[topicIndex];
  const step = topic?.steps[stepIndex];
  const stepCount = topic?.steps.length ?? 0;

  const isFirstStep = topicIndex === 0 && stepIndex === 0;
  const isLastStep = stepIndex >= stepCount - 1;
  const isLastTopic = topicIndex >= topics.length - 1;
  const isFinished = isRevealed && isLastStep && isLastTopic;

  const resetStep = useCallback(() => {
    setIsRevealed(false);
    setRecall('');
  }, []);

  const reveal = useCallback(() => setIsRevealed(true), []);

  const goNext = useCallback(() => {
    if (!isRevealed) {
      setIsRevealed(true);
      return;
    }
    if (!isLastStep) {
      setStepIndex((index) => index + 1);
      resetStep();
      return;
    }
    if (isLastTopic) return;

    setTopicIndex((index) => index + 1);
    setStepIndex(0);
    resetStep();
  }, [isRevealed, isLastStep, isLastTopic, resetStep]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((index) => index - 1);
      resetStep();
      return;
    }
    if (topicIndex === 0) return;

    const prevTopic = topics[topicIndex - 1];
    setTopicIndex((index) => index - 1);
    setStepIndex(Math.max(0, (prevTopic?.steps.length ?? 1) - 1));
    resetStep();
  }, [stepIndex, topicIndex, topics, resetStep]);

  const jumpToTopic = useCallback(
    (index: number) => {
      setTopicIndex(index);
      setStepIndex(0);
      resetStep();
    },
    [resetStep],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && SKIP_SHORTCUT_TAGS.includes(target.tagName)) return;

      if (event.key === ' ' || event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  const totalSteps = topics.reduce((sum, item) => sum + item.steps.length, 0);
  const doneSteps = topics.slice(0, topicIndex).reduce((sum, item) => sum + item.steps.length, 0) + stepIndex;
  const progressPercent = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);

  return {
    topic,
    topicIndex,
    step,
    stepIndex,
    stepCount,
    isRevealed,
    isFirstStep,
    isLastStep,
    isLastTopic,
    isFinished,
    recall,
    setRecall,
    reveal,
    goNext,
    goPrev,
    jumpToTopic,
    doneSteps,
    totalSteps,
    progressPercent,
  };
}
