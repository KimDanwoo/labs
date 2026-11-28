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
          <Gostop.Settings />
        </GameLayout.Status>
        <GameLayout.Board>
          <Gostop.Table>
            <Gostop.Rival />
            <Gostop.Floor />
            <Gostop.Mine />
            <Gostop.Hand />
            <Gostop.Deal />
            <Gostop.CutIn />
          </Gostop.Table>
        </GameLayout.Board>
        <GameLayout.Panel>
          <Gostop.Actions />
          <Gostop.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <Gostop.Announcer />
      <Gostop.DecideSheet />
      <Gostop.ResultSheet />
    </Gostop.Root>
  );
}
