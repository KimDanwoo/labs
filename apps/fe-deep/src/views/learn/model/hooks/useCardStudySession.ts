'use client';

import { getLocalProgress, updateQuestionProgress } from '@entities/progress';
import type { FollowUp, Question } from '@entities/question';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PHASE, type StudyPhase } from '../constants/study';

interface UseCardStudySessionOptions {
  questions: Question[];
  phase: StudyPhase;
  onComplete: () => void;
}

interface CardStudySession {
  currentIndex: number;
  currentQuestion: Question | undefined;
  currentFollowUp: FollowUp | undefined;
  stepIndex: number;
  stepCount: number;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
  recallInput: string;
  setRecallInput: (v: string) => void;
  progressPercent: number;
  isNewCard: boolean;
  handleNext: () => void;
  handleSkip: () => void;
  handleRetry: () => void;
  resetStudy: () => void;
}

export function useCardStudySession({ questions, phase, onComplete }: UseCardStudySessionOptions): CardStudySession {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [recallInput, setRecallInput] = useState('');
  const isAdvancingRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const followUps = currentQuestion?.follow_ups ?? [];
  const stepCount = 1 + followUps.length;
  const currentFollowUp = stepIndex > 0 ? followUps[stepIndex - 1] : undefined;
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const resetStudy = useCallback(() => {
    setCurrentIndex(0);
    setStepIndex(0);
    setIsFlipped(false);
    setRecallInput('');
    isAdvancingRef.current = false;
  }, []);

  const advance = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setStepIndex(0);
      setIsFlipped(false);
      setRecallInput('');
      requestAnimationFrame(() => {
        isAdvancingRef.current = false;
      });
    } else {
      isAdvancingRef.current = false;
      onComplete();
    }
  }, [currentIndex, questions.length, onComplete]);

  const handleNext = useCallback(() => {
    if (!currentQuestion || isAdvancingRef.current) return;

    if (stepIndex + 1 < stepCount) {
      setStepIndex((i) => i + 1);
      setIsFlipped(false);
      setRecallInput('');
      return;
    }

    isAdvancingRef.current = true;
    updateQuestionProgress(currentQuestion.id, true);
    advance();
  }, [currentQuestion, stepIndex, stepCount, advance]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion || isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    advance();
  }, [currentQuestion, advance]);

  const handleRetry = useCallback(() => {
    setIsFlipped(false);
    setRecallInput('');
  }, []);

  useEffect(() => {
    if (phase !== PHASE.study) return undefined;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key !== ' ' && e.key !== 'Enter') return;

      e.preventDefault();
      if (isFlipped) handleNext();
      else setIsFlipped(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isFlipped, handleNext]);

  const progressSnapshot = useMemo(() => {
    if (phase !== PHASE.study) return {};
    return getLocalProgress();
  }, [phase]);

  const isNewCard = useMemo(() => {
    if (!currentQuestion) return true;
    return !progressSnapshot[currentQuestion.id];
  }, [currentQuestion, progressSnapshot]);

  return {
    currentIndex,
    currentQuestion,
    currentFollowUp,
    stepIndex,
    stepCount,
    isFlipped,
    setIsFlipped,
    recallInput,
    setRecallInput,
    progressPercent,
    isNewCard,
    handleNext,
    handleSkip,
    handleRetry,
    resetStudy,
  };
}
