'use client';

import { useContext } from 'react';
import { StudySessionContext } from '../store/studySessionContext';
import type { CardStudySession } from './useCardStudySession';

export function useStudySessionContext(): CardStudySession {
  const session = useContext(StudySessionContext);
  if (!session) throw new Error('StudySession.Root 안에서만 사용할 수 있습니다');
  return session;
}
