'use client';

import { Lotto } from '@views/lotto/ui/lotto';

export function LottoPage() {
  return (
    <Lotto.Root>
      <main className="relative mx-auto flex w-full max-w-[560px] min-w-[360px] flex-col gap-4 px-4 py-6 sm:px-6 md:py-10">
        <Lotto.Header />
        <Lotto.NumberBoard />
        <Lotto.TicketBar />
        <Lotto.SingleDraw />
        <Lotto.BulkRun />
        <Lotto.JackpotRun />
        <Lotto.Results />
        <Lotto.Odds />
        <Lotto.About />
      </main>
    </Lotto.Root>
  );
}
