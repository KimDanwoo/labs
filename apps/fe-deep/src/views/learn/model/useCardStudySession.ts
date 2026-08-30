'use client';

import { getLocalProgress, updateQuestionProgress } from '@entities/progress/api';
import type { FollowUp, Question } from '@entities/question/model';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseCardStudySessionOptions {
  /** 학습할 질문 배열 */
  questions: Question[];
  /** 현재 Phase. 'study'일 때만 키보드 단축키와 progressSnapshot이 활성화된다. */
  phase: string;
  /** 마지막 카드를 넘긴 뒤 호출되는 콜백 */
  onComplete: () => void;
}

interface CardStudySession {
  currentIndex: number;
  currentQuestion: Question | undefined;
  /** 현재 단계의 꼬리질문. 0단계(원 질문)면 undefined. */
  currentFollowUp: FollowUp | undefined;
  stepIndex: number;
  /** 원 질문 1 + 꼬리질문 수. */
  stepCount: number;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
  /** 답을 보기 전에 스스로 적어보는 인출 입력. 카드마다 초기화된다. */
  recallInput: string;
  setRecallInput: (v: string) => void;
  progressPercent: number;
  isNewCard: boolean;
  handleNext: () => void;
  /** 답을 확인하지 않고 다음 카드로 건너뛴다. 학습 기록을 남기지 않는다. */
  handleSkip: () => void;
  /** 현재 카드를 안 뒤집힌 상태로 되돌려 다시 풀게 한다. */
  handleRetry: () => void;
  resetStudy: () => void;
}

/**
 * 카드 학습 세션의 상태·로직을 관리하는 훅.
 * - 타이핑 인출 → 답 확인 → 다음 흐름. 평가 없이 "봤다" 기록만 남긴다.
 * - 키보드 단축키: Space/Enter로 확인·다음
 */
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

  /** 학습 상태를 초기화한다. 새 세션 시작 시 호출. */
  const resetStudy = useCallback(() => {
    setCurrentIndex(0);
    setStepIndex(0);
    setIsFlipped(false);
    setRecallInput('');
    isAdvancingRef.current = false;
  }, []);

  /** 다음 카드로 이동한다. 마지막 카드면 onComplete를 호출한다. */
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

  /** 꼬리질문이 남았으면 다음 단계로, 마지막 단계면 기록을 남기고 다음 카드로 이동한다. */
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

  /** 현재 카드를 처음부터 다시 푼다. 입력을 비우고 질문 상태로 되돌린다. */
  const handleRetry = useCallback(() => {
    setIsFlipped(false);
    setRecallInput('');
  }, []);

  // 키보드 단축키: Space/Enter로 뒤집기 → 다음
  useEffect(() => {
    if (phase !== 'study') return undefined;

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

  // 학습 시작 시점의 progress 스냅샷. 카드마다 getLocalProgress()를 재호출하지 않는다.
  const progressSnapshot = useMemo(() => {
    if (phase !== 'study') return {};
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
