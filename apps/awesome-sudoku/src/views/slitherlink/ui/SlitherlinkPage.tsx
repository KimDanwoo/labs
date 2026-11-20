'use client';

import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { SlitherlinkGame } from '@views/slitherlink/ui/slitherlinkGame';

export function SlitherlinkPage() {
  return (
    <SlitherlinkGame.Root>
      <main className="relative min-h-svh min-w-[360px] overflow-x-hidden bg-surface-secondary">
        <h1 className="sr-only">{SLITHERLINK_COPY.title}</h1>
        <SlitherlinkGame.Backdrop />
        <div className="relative mx-auto flex flex-col items-center px-4 py-6 sm:px-6 md:py-10 lg:grid lg:grid-cols-[auto_auto] lg:items-start lg:justify-center lg:gap-12">
          <div className="flex w-full flex-col items-center lg:w-auto">
            <SlitherlinkGame.Status />
            <SlitherlinkGame.Board />
            <SlitherlinkGame.Notice />
          </div>
          <SlitherlinkGame.SidePanel />
          <SlitherlinkGame.MobilePanel />
        </div>
        <SlitherlinkGame.ResultSheet />
        <SlitherlinkGame.ConfirmSheet />
      </main>
    </SlitherlinkGame.Root>
  );
}
