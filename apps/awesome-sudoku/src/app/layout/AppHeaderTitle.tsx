import Link from 'next/link';

import { GameSwitcher } from '@app/layout/game-switcher/gameSwitcher';
import { SITE_NAME } from '@entities/game-catalog';

export function AppHeaderTitle() {
  return (
    <div className="flex min-w-0 items-center gap-1 self-stretch">
      <Link
        href="/"
        className="inline-flex min-h-11 shrink-0 items-center font-bold text-text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        {SITE_NAME}
      </Link>
      <GameSwitcher.Root>
        <GameSwitcher.Separator />
        <GameSwitcher.Menu>
          <GameSwitcher.Trigger />
          <GameSwitcher.Panel />
        </GameSwitcher.Menu>
      </GameSwitcher.Root>
    </div>
  );
}
