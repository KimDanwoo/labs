'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { Walls } from '@views/walls/ui/walls';

export function WallsPage() {
  return (
    <Walls.Root>
      <GameLayout.Root>
        <GameHeading game="walls" />
        <GameLayout.Status>
          <Walls.Status />
        </GameLayout.Status>
        <GameLayout.Board>
          <Walls.Board />
        </GameLayout.Board>
        <GameLayout.Panel>
          <Walls.Score />
          <Walls.Actions />
          <Walls.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <Walls.ResultSheet />
    </Walls.Root>
  );
}
