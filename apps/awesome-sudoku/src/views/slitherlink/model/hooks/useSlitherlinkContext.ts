'use client';

import type { SlitherlinkGame } from '@views/slitherlink/model/hooks/useSlitherlinkGame';
import { SlitherlinkContext } from '@views/slitherlink/model/store/slitherlinkContext';
import { useContext } from 'react';

export function useSlitherlinkContext(): SlitherlinkGame {
  const game = useContext(SlitherlinkContext);
  if (!game) throw new Error('SlitherlinkGame.Root 안에서만 사용할 수 있어요');
  return game;
}
