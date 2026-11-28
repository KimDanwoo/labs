import { LuRotateCcw } from 'react-icons/lu';

import { Button } from '@shared/ui/button';
import { GameLayout } from '@shared/ui/game-layout';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useNewGame } from '@views/gostop/model/hooks/useNewGame';

export function GostopActions() {
  const { isDeciding, go, stop } = useGostopContext();
  const handleNewGame = useNewGame();

  if (isDeciding) {
    return (
      <GameLayout.Actions>
        <Button variant="weak" size="xl" onClick={stop}>
          {GOSTOP_COPY.stop}
        </Button>
        <Button size="xl" onClick={go}>
          {GOSTOP_COPY.go}
        </Button>
      </GameLayout.Actions>
    );
  }

  return (
    <Button variant="weak" size="xl" isFull onClick={handleNewGame}>
      <LuRotateCcw aria-hidden="true" />
      {GOSTOP_COPY.newGame}
    </Button>
  );
}
