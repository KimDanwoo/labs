import Link from 'next/link';

import { BrandMark } from '@app/layout/BrandMark';
import { GameSwitcher } from '@app/layout/game-switcher/gameSwitcher';
import { SITE_NAME } from '@entities/game-catalog';

export function AppHeaderTitle() {
  return (
    <div className="flex min-w-0 items-center gap-1.5 self-stretch">
      <Link
        href="/"
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-lg font-extrabold tracking-[-0.03em] text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <BrandMark />
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
