import Link from 'next/link';

import { SITE_NAME } from '@views/home/config/page';
import { ThemeToggle } from '@views/home/ui/theme-toggle/ThemeToggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-lg py-md header-condense">
        <Link
          href="/"
          aria-label={`${SITE_NAME} 홈`}
          className="group inline-flex items-center gap-sm transition-opacity duration-200 hover:opacity-70"
        >
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary transition-transform duration-300 group-hover:scale-125" />
          <span className="font-display text-base font-bold tracking-[-0.02em] text-foreground">{SITE_NAME}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
