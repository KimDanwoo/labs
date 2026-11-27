'use client';

import { LOTTO_COPY } from '@views/lotto/config/copy';
import { Lotto } from '@views/lotto/ui/lotto';

export function LottoPage() {
  return (
    <Lotto.Root>
      <main className="relative mx-auto flex min-w-[360px] flex-col items-center gap-4 px-4 py-6 sm:px-6 md:py-10">
        <h1 className="sr-only">{LOTTO_COPY.title}</h1>
        <Lotto.Status />
        <Lotto.Board />
        <Lotto.Controls />
        <Lotto.About />
        <Lotto.ResultSheet />
      </main>
    </Lotto.Root>
  );
}
