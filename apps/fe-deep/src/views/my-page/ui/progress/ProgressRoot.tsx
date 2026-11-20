'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import type { ReactNode } from 'react';

import { useProgressStats } from '@views/my-page/model/hooks/useProgressStats';
import { ProgressStatsContext } from '@views/my-page/model/store/progressStatsContext';

interface ProgressRootProps {
  children: ReactNode;
}

export function ProgressRoot({ children }: ProgressRootProps) {
  const stats = useProgressStats();
  return (
    <ProgressStatsContext.Provider value={stats}>
      <PageContainer width="medium" enter="fade">
        {children}
      </PageContainer>
    </ProgressStatsContext.Provider>
  );
}
