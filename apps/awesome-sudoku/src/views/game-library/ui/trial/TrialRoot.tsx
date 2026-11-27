'use client';

import type { ReactNode } from 'react';

import { useTrialCarousel } from '@views/game-library/model/hooks/useTrialCarousel';
import { TrialContext } from '@views/game-library/model/store/trialContext';

interface TrialRootProps {
  wallsGuide: ReactNode;
  children: ReactNode;
}

export function TrialRoot({ wallsGuide, children }: TrialRootProps) {
  const trial = useTrialCarousel();

  return (
    <TrialContext.Provider value={{ ...trial, wallsGuide }}>
      <section aria-labelledby={`${trial.baseId}-title`} className="min-w-0">
        {children}
      </section>
    </TrialContext.Provider>
  );
}
