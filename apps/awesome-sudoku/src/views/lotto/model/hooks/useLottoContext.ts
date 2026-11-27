'use client';

import { useContext } from 'react';

import type { LottoGame } from '@views/lotto/model/hooks/useLottoGame';
import { LottoContext } from '@views/lotto/model/store/lottoContext';

export function useLottoContext(): LottoGame {
  const game = useContext(LottoContext);
  if (!game) throw new Error('Lotto.Root 안에서만 사용할 수 있어요');
  return game;
}
