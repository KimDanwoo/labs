'use client';

import { getCurrentStreak } from '@entities/progress';
import { getAllCategories, type Question } from '@entities/question';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@ui/react';
import { X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { loadStudyQuestions } from '../api/loadStudyQuestions';
import { DEFAULT_SETTINGS, PHASE, type StudyPhase, type StudySettings } from '../model/constants/study';
import { useCardStudySession } from '../model/hooks/useCardStudySession';
import { LearnDone } from './LearnDone';
import { LearnSetup } from './LearnSetup';
import { StudyCardView } from './StudyCardView';

export function LearnPage() {
  const [phase, setPhase] = useState<StudyPhase>(PHASE.setup);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => getAllCategories() });

  const onComplete = useCallback(() => {
    setStreak(getCurrentStreak());
    setPhase(PHASE.done);
  }, []);

  const {
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
  } = useCardStudySession({ questions, phase, onComplete });

  const startStudy = async (nextSettings: StudySettings) => {
    setSettings(nextSettings);
    setPhase(PHASE.loading);
    setIsEmpty(false);

    try {
      const loaded = await loadStudyQuestions(nextSettings, categories.data ?? []);
      if (loaded.length === 0) {
        setIsEmpty(true);
        setPhase(PHASE.setup);
        return;
      }
      setQuestions(loaded);
      resetStudy();
      setPhase(PHASE.study);
    } catch (cause) {
      setLoadError(new Error('학습 문제를 불러오지 못했습니다.', { cause }));
    }
  };

  const backToSetup = () => {
    setQuestions([]);
    setPhase(PHASE.setup);
  };

  if (categories.error) throw new Error('학습 카테고리를 불러오지 못했습니다.', { cause: categories.error });
  if (loadError) throw loadError;

  if (phase === PHASE.setup || phase === PHASE.loading) {
    return (
      <LearnSetup
        categories={categories.data ?? []}
        isLoadingCategories={categories.isPending}
        initialSettings={settings}
        isStarting={phase === PHASE.loading}
        isEmpty={isEmpty}
        onStart={startStudy}
      />
    );
  }

  if (phase === PHASE.done) {
    return <LearnDone questionCount={questions.length} streak={streak} onRestart={backToSetup} />;
  }

  return (
    <StudyCardView
      currentIndex={currentIndex}
      totalCount={questions.length}
      currentQuestion={currentQuestion}
      currentFollowUp={currentFollowUp}
      stepIndex={stepIndex}
      stepCount={stepCount}
      isFlipped={isFlipped}
      onFlip={() => setIsFlipped(true)}
      progressPercent={progressPercent}
      isNewCard={isNewCard}
      onNext={handleNext}
      onSkip={handleSkip}
      onRetry={handleRetry}
      recallInput={recallInput}
      onRecallChange={setRecallInput}
      headerAction={
        <Button variant="ghost" size="sm" onClick={backToSetup} className="gap-1 text-muted-foreground h-7 px-2">
          <X className="h-3.5 w-3.5" />
          종료
        </Button>
      }
    />
  );
}
