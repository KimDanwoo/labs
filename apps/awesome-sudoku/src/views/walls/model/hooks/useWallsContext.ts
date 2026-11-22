'use client';

import type { WallsGame } from '@views/walls/model/hooks/useWallsGame';
import { WallsContext } from '@views/walls/model/store/wallsContext';
import { useContext } from 'react';

export function useWallsContext(): WallsGame {
  const game = useContext(WallsContext);
  if (!game) throw new Error('Walls.Root 안에서만 사용할 수 있어요');
  return game;
}
