'use client';

import type { ReactNode } from 'react';

import { STICKY_BELOW_HEADER } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';
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
      <section
        aria-labelledby={`${trial.baseId}-title`}
        className={cn('min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1', STICKY_BELOW_HEADER)}
      >
        {children}
      </section>
    </TrialContext.Provider>
  );
}
