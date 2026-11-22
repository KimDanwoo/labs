'use client';

import { GAME_NAV_ITEMS } from '@app/config/navigation';
import { cn } from '@shared/lib/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function GameNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="게임 종류"
      className="flex min-w-0 items-center gap-1 overflow-x-auto p-1 bg-bg-tertiary/80 rounded-xl backdrop-blur-sm"
    >
      {GAME_NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(
            'px-2 lg:px-4 py-1.5 rounded-lg text-xs lg:text-sm whitespace-nowrap font-normal transition-all duration-200 ease-out',
            pathname === href
              ? 'bg-surface-primary text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
