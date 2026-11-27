import { LuPlus, LuUndo2 } from 'react-icons/lu';

import { Button } from '@shared/ui/button';
import { GameLayout } from '@shared/ui/game-layout';
import { GOMOKU_COPY } from '@views/gomoku/config/copy';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function GomokuActions() {
  const { canUndo, undo, reset } = useGomokuContext();

  return (
    <GameLayout.Actions>
      <Button variant="weak" size="xl" onClick={undo} disabled={!canUndo}>
        <LuUndo2 aria-hidden="true" />
        {GOMOKU_COPY.undo}
      </Button>
      <Button size="xl" onClick={reset}>
        <LuPlus aria-hidden="true" />
        {GOMOKU_COPY.newGame}
      </Button>
    </GameLayout.Actions>
  );
}
