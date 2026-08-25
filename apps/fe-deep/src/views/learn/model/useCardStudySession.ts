'use client';

import { getLocalProgress, updateQuestionProgress } from '@entities/progress';
import type { Question } from '@entities/question';
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
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
  /** 답을 보기 전에 스스로 적어보는 인출 입력. 카드마다 초기화된다. */
  recallInput: string;
  setRecallInput: (v: string) => void;
  progressPercent: number;
  isNewCard: boolean;
  handleNext: () => void;
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [recallInput, setRecallInput] = useState('');
  const isAdvancingRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  /** 학습 상태를 초기화한다. 새 세션 시작 시 호출. */
  const resetStudy = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRecallInput('');
    isAdvancingRef.current = false;
  }, []);

  /** 현재 카드를 학습 기록에 남기고 다음 카드로 이동한다. 마지막 카드면 onComplete를 호출한다. */
  const handleNext = useCallback(() => {
    if (!currentQuestion || isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    updateQuestionProgress(currentQuestion.id, true);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setRecallInput('');
      requestAnimationFrame(() => {
        isAdvancingRef.current = false;
      });
    } else {
      isAdvancingRef.current = false;
      onComplete();
    }
  }, [currentQuestion, currentIndex, questions.length, onComplete]);

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
    isFlipped,
    setIsFlipped,
    recallInput,
    setRecallInput,
    progressPercent,
    isNewCard,
    handleNext,
    handleRetry,
    resetStudy,
  };
}
