'use client';

import { useContext } from 'react';

import { FeaturedGameContext, type FeaturedGame } from '@views/game-library/model/store/featuredGameContext';

export function useFeaturedGameContext(): FeaturedGame {
  const featured = useContext(FeaturedGameContext);
  if (!featured) throw new Error('FeaturedSlide.Root 안에서만 사용할 수 있어요');
  return featured;
}
