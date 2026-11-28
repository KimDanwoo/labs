'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { Gostop } from '@views/gostop/ui/gostop';

export function GostopPage() {
  return (
    <Gostop.Root>
      <GameLayout.Root size="wide">
        <GameHeading game="gostop" />
        <GameLayout.Status>
          <Gostop.Status />
          <Gostop.Settings />
          <Gostop.Menu />
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
          <Gostop.Side>
            <Gostop.Actions />
            <Gostop.Record />
            <Gostop.Rule />
          </Gostop.Side>
        </GameLayout.Panel>
      </GameLayout.Root>
      <Gostop.Announcer />
      <Gostop.Bonus />
      <Gostop.DecideSheet />
      <Gostop.CapturedSheet />
      <Gostop.ResultSheet />
    </Gostop.Root>
  );
}
