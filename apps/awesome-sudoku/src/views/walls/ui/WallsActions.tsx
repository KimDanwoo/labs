import { LuPlus, LuUndo2 } from 'react-icons/lu';

import { Button } from '@shared/ui/button';
import { GameLayout } from '@shared/ui/game-layout';
import { WALLS_COPY } from '@views/walls/config/copy';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function WallsActions() {
  const { canUndo, undo, reset } = useWallsContext();

  return (
    <GameLayout.Actions>
      <Button variant="weak" size="xl" onClick={undo} disabled={!canUndo}>
        <LuUndo2 aria-hidden="true" />
        {WALLS_COPY.undo}
      </Button>
      <Button size="xl" onClick={reset}>
        <LuPlus aria-hidden="true" />
        {WALLS_COPY.newGame}
      </Button>
    </GameLayout.Actions>
  );
}
