'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import type { ReactNode } from 'react';

import { useStudySetup, type StudySetupSource } from '../../model/hooks/useStudySetup';
import { StudySetupContext } from '../../model/store/studySetupContext';

interface StudySetupRootProps {
  setup: StudySetupSource;
  children: ReactNode;
}

export function StudySetupRoot({ setup, children }: StudySetupRootProps) {
  const value = useStudySetup(setup);

  return (
    <StudySetupContext.Provider value={value}>
      <PageContainer width="narrow" enter="fade">
        {children}
      </PageContainer>
    </StudySetupContext.Provider>
  );
}
