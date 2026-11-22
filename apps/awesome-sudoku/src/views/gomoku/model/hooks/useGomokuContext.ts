'use client';

import type { GomokuGame } from '@views/gomoku/model/hooks/useGomokuGame';
import { GomokuContext } from '@views/gomoku/model/store/gomokuContext';
import { useContext } from 'react';

export function useGomokuContext(): GomokuGame {
  const game = useContext(GomokuContext);
  if (!game) throw new Error('Gomoku.Root 안에서만 사용할 수 있어요');
  return game;
}
