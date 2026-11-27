import type { ReactNode } from 'react';

import { useLottoGame } from '@views/lotto/model/hooks/useLottoGame';
import { LottoContext } from '@views/lotto/model/store/lottoContext';

interface LottoRootProps {
  children: ReactNode;
}

export function LottoRoot({ children }: LottoRootProps) {
  const game = useLottoGame();
  return <LottoContext.Provider value={game}>{children}</LottoContext.Provider>;
}
