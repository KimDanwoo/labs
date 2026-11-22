import { useGomokuGame } from '@views/gomoku/model/hooks/useGomokuGame';
import { GomokuContext } from '@views/gomoku/model/store/gomokuContext';
import type { ReactNode } from 'react';

interface GomokuRootProps {
  children: ReactNode;
}

export function GomokuRoot({ children }: GomokuRootProps) {
  const game = useGomokuGame();

  return <GomokuContext.Provider value={game}>{children}</GomokuContext.Provider>;
}
