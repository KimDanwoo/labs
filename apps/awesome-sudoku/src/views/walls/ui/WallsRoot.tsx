import { useWallsGame } from '@views/walls/model/hooks/useWallsGame';
import { WallsContext } from '@views/walls/model/store/wallsContext';
import type { ReactNode } from 'react';

interface WallsRootProps {
  children: ReactNode;
}

export function WallsRoot({ children }: WallsRootProps) {
  const game = useWallsGame();

  return <WallsContext.Provider value={game}>{children}</WallsContext.Provider>;
}
