import { useElapsedSeconds } from '@views/slitherlink/model/hooks/useElapsedSeconds';
import { useSlitherlinkGame } from '@views/slitherlink/model/hooks/useSlitherlinkGame';
import { ElapsedContext } from '@views/slitherlink/model/store/elapsedContext';
import { SlitherlinkContext } from '@views/slitherlink/model/store/slitherlinkContext';
import type { ReactNode } from 'react';

interface SlitherlinkRootProps {
  children: ReactNode;
}

export function SlitherlinkRoot({ children }: SlitherlinkRootProps) {
  const game = useSlitherlinkGame();
  const elapsedSeconds = useElapsedSeconds(game.isPlaying, game.puzzle);

  return (
    <SlitherlinkContext.Provider value={game}>
      <ElapsedContext.Provider value={elapsedSeconds}>{children}</ElapsedContext.Provider>
    </SlitherlinkContext.Provider>
  );
}
