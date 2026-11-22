'use client';

import { WALLS_COPY } from '@views/walls/config/copy';
import { Walls } from '@views/walls/ui/walls';

export function WallsPage() {
  return (
    <Walls.Root>
      <main className="relative mx-auto flex min-w-[360px] flex-col items-center gap-4 px-4 py-6 sm:px-6 md:py-10">
        <h1 className="sr-only">{WALLS_COPY.title}</h1>
        <Walls.Status />
        <Walls.Board />
        <Walls.Controls />
        <Walls.ResultSheet />
      </main>
    </Walls.Root>
  );
}
