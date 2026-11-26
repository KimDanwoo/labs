import Link from 'next/link';

import { ThemeToggle } from '@app/layout/theme-toggle/ThemeToggle';
import { SITE_NAME } from '@entities/game-catalog';

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border-light bg-surface-primary">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-bold text-text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {SITE_NAME}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
