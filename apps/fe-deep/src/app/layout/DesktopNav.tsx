'use client';

import { Button } from '@shared/ui/Button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MAIN_NAV_ITEMS } from '../config/navigation';
import { isActivePath } from '../lib/isActivePath';

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center space-x-1 flex-1" aria-label="메인 네비게이션">
      {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          variant={isActivePath(pathname, href) ? 'secondary' : 'ghost'}
          size="sm"
          className="gap-2"
          asChild
        >
          <Link href={href}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
