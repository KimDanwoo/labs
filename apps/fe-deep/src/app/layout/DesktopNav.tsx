'use client';

import { Button } from '@shared/ui/Button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MAIN_NAV_ITEMS } from '../config/navigation';
import { isActivePath } from '../lib/isActivePath';
import { styles } from './DesktopNav.styles';

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="메인 네비게이션">
      {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          variant={isActivePath(pathname, href) ? 'secondary' : 'ghost'}
          size="sm"
          className={styles.item}
          asChild
        >
          <Link href={href}>
            <Icon className={styles.icon} />
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
