import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { getCurrentStreak } from '@entities/progress';
import { getAllCategories, type Question } from '@entities/question';

import { loadStudyQuestions } from '@views/learn/api/loadStudyQuestions';
import { CATEGORIES_QUERY_KEY } from '@views/learn/config/queryKeys';
import { DEFAULT_SETTINGS, PHASE, type StudyPhase, type StudySettings } from '@views/learn/model/constants/study';
import { useCardStudySession } from '@views/learn/model/hooks/useCardStudySession';
import type { StudySetupSource } from '@views/learn/model/hooks/useStudySetup';

export function useLearnFlow() {
  const [phase, setPhase] = useState<StudyPhase>(PHASE.setup);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const categories = useQuery({ queryKey: CATEGORIES_QUERY_KEY, queryFn: () => getAllCategories() });

  const onComplete = useCallback(() => {
    setStreak(getCurrentStreak());
    setPhase(PHASE.done);
  }, []);

  const session = useCardStudySession({ questions, phase, onComplete });

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
      session.resetStudy();
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

  const setup: StudySetupSource = {
    categories: categories.data ?? [],
    isLoadingCategories: categories.isPending,
    initialSettings: settings,
    isStarting: phase === PHASE.loading,
    isEmpty,
    onStart: startStudy,
  };

  return { phase, questionCount: questions.length, streak, backToSetup, setup, session };
}
