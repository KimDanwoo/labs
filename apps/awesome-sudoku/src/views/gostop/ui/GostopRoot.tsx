import { useGostopGame } from '@views/gostop/model/hooks/useGostopGame';
import { GostopContext } from '@views/gostop/model/store/gostopContext';
import type { ReactNode } from 'react';

interface GostopRootProps {
  children: ReactNode;
}

export function GostopRoot({ children }: GostopRootProps) {
  const game = useGostopGame();

  return <GostopContext.Provider value={game}>{children}</GostopContext.Provider>;
}
