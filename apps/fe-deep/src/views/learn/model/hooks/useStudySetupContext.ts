'use client';

import { useContext } from 'react';
import { StudySetupContext } from '../store/studySetupContext';
import type { StudySetup } from './useStudySetup';

export function useStudySetupContext(): StudySetup {
  const setup = useContext(StudySetupContext);
  if (!setup) throw new Error('StudySetup.Root 안에서만 사용할 수 있습니다');
  return setup;
}
