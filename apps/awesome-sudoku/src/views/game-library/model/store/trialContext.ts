'use client';

import { createContext, type ReactNode } from 'react';

import type { useTrialCarousel } from '@views/game-library/model/hooks/useTrialCarousel';

export interface TrialModel extends ReturnType<typeof useTrialCarousel> {
  wallsGuide: ReactNode;
}

export const TrialContext = createContext<TrialModel | null>(null);
