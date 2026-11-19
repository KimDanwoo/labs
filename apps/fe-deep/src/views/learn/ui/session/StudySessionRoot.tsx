'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import type { ReactNode } from 'react';

import type { CardStudySession } from '../../model/hooks/useCardStudySession';
import { StudySessionContext } from '../../model/store/studySessionContext';

interface StudySessionRootProps {
  session: CardStudySession;
  children: ReactNode;
}

export function StudySessionRoot({ session, children }: StudySessionRootProps) {
  return (
    <StudySessionContext.Provider value={session}>
      <PageContainer width="narrow">{children}</PageContainer>
    </StudySessionContext.Provider>
  );
}
