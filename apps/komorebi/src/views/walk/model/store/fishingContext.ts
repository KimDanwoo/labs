'use client';

import type { CompanionReaction } from '@views/walk/lib/companions';
import type { FishingSession } from '@views/walk/model/hooks/useFishingSession';
import { createContext } from 'react';

export interface FishingModel extends FishingSession {
  onReact: (reaction: CompanionReaction) => void;
}

export const FishingContext = createContext<FishingModel | null>(null);
