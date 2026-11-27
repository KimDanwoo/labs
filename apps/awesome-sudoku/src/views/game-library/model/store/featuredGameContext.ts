'use client';

import { createContext } from 'react';

import type { ShelfGame } from '@entities/game-catalog';
import type { TrialSlide } from '@views/game-library/config/featuredSlides';

export interface FeaturedGame {
  game: ShelfGame;
  slide: TrialSlide;
}

export const FeaturedGameContext = createContext<FeaturedGame | null>(null);
