'use client';

import { GOMOKU_COPY } from '@views/gomoku/config/copy';
import { Gomoku } from '@views/gomoku/ui/gomoku';

export function GomokuPage() {
  return (
    <Gomoku.Root>
      <main className="relative mx-auto flex min-w-[360px] flex-col items-center gap-4 px-4 py-6 sm:px-6 md:py-10">
        <h1 className="sr-only">{GOMOKU_COPY.title}</h1>
        <Gomoku.Status />
        <Gomoku.Board />
        <Gomoku.Controls />
        <Gomoku.ResultSheet />
      </main>
    </Gomoku.Root>
  );
}
