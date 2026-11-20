'use client';

import { createContext } from 'react';
import type { CompanionReaction } from '../../lib/companions';
import type { FishingSession } from '../hooks/useFishingSession';

export interface FishingModel extends FishingSession {
  onReact: (reaction: CompanionReaction) => void;
}

export const FishingContext = createContext<FishingModel | null>(null);
