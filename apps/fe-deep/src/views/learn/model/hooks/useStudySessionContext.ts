'use client';

import type { CardStudySession } from '@views/learn/model/hooks/useCardStudySession';
import { StudySessionContext } from '@views/learn/model/store/studySessionContext';
import { useContext } from 'react';

export function useStudySessionContext(): CardStudySession {
  const session = useContext(StudySessionContext);
  if (!session) throw new Error('StudySession.Root 안에서만 사용할 수 있습니다');
  return session;
}
