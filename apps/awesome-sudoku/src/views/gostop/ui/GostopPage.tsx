'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { Gostop } from '@views/gostop/ui/gostop';

export function GostopPage() {
  return (
    <Gostop.Root>
      <GameLayout.Root>
        <GameHeading game="gostop" />
        <GameLayout.Status>
          <Gostop.Status />
        </GameLayout.Status>
        <GameLayout.Board>
          <Gostop.Table>
            <Gostop.Rival />
            <Gostop.TurnBar />
            <Gostop.Floor />
            <Gostop.Captured />
            <Gostop.Hand />
          </Gostop.Table>
        </GameLayout.Board>
        <GameLayout.Panel>
          <Gostop.Actions />
          <Gostop.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <Gostop.DecideSheet />
      <Gostop.ResultSheet />
    </Gostop.Root>
  );
}
