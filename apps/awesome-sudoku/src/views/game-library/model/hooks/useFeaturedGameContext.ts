'use client';

import { useContext } from 'react';

import type { ShelfGame } from '@entities/game-catalog';
import { FeaturedGameContext } from '@views/game-library/model/store/featuredGameContext';

export function useFeaturedGameContext(): ShelfGame {
  const game = useContext(FeaturedGameContext);
  if (!game) throw new Error('FeaturedSlide.Root 안에서만 사용할 수 있어요');
  return game;
}
