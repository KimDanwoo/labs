'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { SlitherlinkGame } from '@views/slitherlink/ui/slitherlinkGame';

export function SlitherlinkPage() {
  return (
    <SlitherlinkGame.Root>
      <GameLayout.Root>
        <GameHeading game="slitherlink" />
        <GameLayout.Status>
          <SlitherlinkGame.Status />
        </GameLayout.Status>
        <GameLayout.Board>
          <SlitherlinkGame.Board />
        </GameLayout.Board>
        <GameLayout.Panel>
          <SlitherlinkGame.Controls />
          <SlitherlinkGame.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <SlitherlinkGame.ResultSheet />
      <SlitherlinkGame.ConfirmSheet />
    </SlitherlinkGame.Root>
  );
}
