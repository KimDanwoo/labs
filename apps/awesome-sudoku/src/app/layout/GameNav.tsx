'use client';

import { GAME_NAV_ITEMS } from '@app/config/navigation';
import { cn } from '@shared/lib/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function GameNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="게임 종류" className="flex items-center gap-1 p-1 bg-bg-tertiary/80 rounded-xl backdrop-blur-sm">
      {GAME_NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(
            'px-3 xs:px-4 py-1.5 rounded-lg text-sm font-normal transition-all duration-200 ease-out',
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
