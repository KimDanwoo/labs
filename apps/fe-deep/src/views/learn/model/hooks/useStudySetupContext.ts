'use client';

import type { StudySetup } from '@views/learn/model/hooks/useStudySetup';
import { StudySetupContext } from '@views/learn/model/store/studySetupContext';
import { useContext } from 'react';

export function useStudySetupContext(): StudySetup {
  const setup = useContext(StudySetupContext);
  if (!setup) throw new Error('StudySetup.Root 안에서만 사용할 수 있습니다');
  return setup;
}
