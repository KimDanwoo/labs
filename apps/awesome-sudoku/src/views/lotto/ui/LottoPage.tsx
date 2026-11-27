'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { Lotto } from '@views/lotto/ui/lotto';

export function LottoPage() {
  return (
    <Lotto.Root>
      <GameLayout.Root>
        <GameHeading game="lotto" />
        <GameLayout.Status>
          <Lotto.Status />
        </GameLayout.Status>
        <GameLayout.Board>
          <Lotto.Board />
        </GameLayout.Board>
        <GameLayout.Panel>
          <Lotto.Controls />
          <Lotto.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <Lotto.ResultSheet />
    </Lotto.Root>
  );
}
