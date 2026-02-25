'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { reviewCard, getLocalProgress } from '@/entities/progress';
import type { ReviewRating, FlashcardResult, UserProgress } from '@/entities/progress';
import type { Question } from '@/entities/question';

interface UseCardStudySessionOptions {
  /** 학습할 질문 배열 */
  questions: Question[];
  /** 현재 Phase. 'study'일 때만 키보드 단축키와 progressSnapshot이 활성화된다. */
  phase: string;
  /** 마지막 카드 평가 완료 시 호출되는 콜백 */
  onComplete: () => void;
}

interface CardStudySession {
  currentIndex: number;
  currentQuestion: Question | undefined;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
  results: FlashcardResult[];
  progressPercent: number;
  isNewCard: boolean;
  currentProgress: UserProgress | null;
  resultCounts: { again: number; hard: number; good: number; easy: number };
  handleRate: (rating: ReviewRating) => void;
  resetStudy: () => void;
}

/**
 * 카드 학습 세션의 공통 상태·로직을 관리하는 훅.
 * FlashcardPage와 DailyPage에서 공유한다.
 * - 카드 넘기기, 평가, 키보드 단축키(1~4, Space/Enter)
 * - 진도 스냅샷, 새 카드 여부, 결과 집계
 */
export function useCardStudySession({
  questions,
  phase,
  onComplete,
}: UseCardStudySessionOptions): CardStudySession {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const isRatingRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0
    ? (currentIndex / questions.length) * 100
    : 0;

  /** 학습 상태를 초기화한다. 새 세션 시작 시 호출. */
  const resetStudy = useCallback(() => {
    setCurrentIndex(0);
    setResults([]);
    setIsFlipped(false);
    isRatingRef.current = false;
  }, []);

  /** 현재 카드를 평가하고 다음 카드로 이동한다. 마지막 카드면 onComplete를 호출한다. */
  const handleRate = useCallback((rating: ReviewRating) => {
    if (!currentQuestion || isRatingRef.current) return;
    isRatingRef.current = true;

    reviewCard(currentQuestion.id, rating);
    setResults((prev) => [...prev, { questionId: currentQuestion.id, rating }]);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      requestAnimationFrame(() => { isRatingRef.current = false; });
    } else {
      isRatingRef.current = false;
      onComplete();
    }
  }, [currentQuestion, currentIndex, questions.length, onComplete]);

  // 키보드 단축키: Space/Enter로 뒤집기, 1~4로 평가
  useEffect(() => {
    if (phase !== 'study') return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (!isFlipped) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else {
        switch (e.key) {
          case '1': handleRate('again'); break;
          case '2': handleRate('hard'); break;
          case '3': handleRate('good'); break;
          case '4': handleRate('easy'); break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isFlipped, handleRate]);

  // 학습 시작 시점의 progress 스냅샷. 카드마다 getLocalProgress()를 재호출하지 않는다.
  const progressSnapshot = useMemo(() => {
    if (phase !== 'study') return {};
    return getLocalProgress();
  }, [phase]);

  const isNewCard = useMemo(() => {
    if (!currentQuestion) return true;
    return !progressSnapshot[currentQuestion.id];
  }, [currentQuestion, progressSnapshot]);

  const currentProgress = useMemo(() => {
    if (!currentQuestion) return null;
    return progressSnapshot[currentQuestion.id] ?? null;
  }, [currentQuestion, progressSnapshot]);

  const resultCounts = useMemo(() => {
    let again = 0, hard = 0, good = 0, easy = 0;
    for (const r of results) {
      switch (r.rating) {
        case 'again': again++; break;
        case 'hard': hard++; break;
        case 'good': good++; break;
        case 'easy': easy++; break;
      }
    }
    return { again, hard, good, easy };
  }, [results]);

  return {
    currentIndex,
    currentQuestion,
    isFlipped,
    setIsFlipped,
    results,
    progressPercent,
    isNewCard,
    currentProgress,
    resultCounts,
    handleRate,
    resetStudy,
  };
}
