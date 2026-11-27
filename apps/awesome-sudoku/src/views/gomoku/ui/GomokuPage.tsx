'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { Gomoku } from '@views/gomoku/ui/gomoku';

export function GomokuPage() {
  return (
    <Gomoku.Root>
      <GameLayout.Root>
        <GameHeading game="gomoku" />
        <GameLayout.Status>
          <Gomoku.Status />
        </GameLayout.Status>
        <GameLayout.Board>
          <Gomoku.Board />
        </GameLayout.Board>
        <GameLayout.Panel>
          <Gomoku.ColorSelect />
          <Gomoku.Actions />
          <Gomoku.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <Gomoku.ResultSheet />
    </Gomoku.Root>
  );
}
