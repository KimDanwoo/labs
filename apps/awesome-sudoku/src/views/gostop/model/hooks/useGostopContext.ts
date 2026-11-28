'use client';

import type { GostopGame } from '@views/gostop/model/hooks/useGostopGame';
import { GostopContext } from '@views/gostop/model/store/gostopContext';
import { useContext } from 'react';

export function useGostopContext(): GostopGame {
  const game = useContext(GostopContext);
  if (!game) throw new Error('Gostop.Root 안에서만 사용할 수 있어요');
  return game;
}
