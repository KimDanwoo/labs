'use client';

import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { MAIN_NAV_ITEMS, MY_PAGE_NAV_ITEMS } from '../config/navigation';
import { isActivePath } from '../lib/isActivePath';
import { styles } from './MobileNav.styles';

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const handleNavigate = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className={styles.trigger}>
        <Button variant="ghost" size="icon" aria-label="메뉴 열기">
          <Menu className={styles.triggerIcon} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className={styles.content}>
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        <nav className={styles.nav}>
          {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant={isActivePath(pathname, href) ? 'secondary' : 'ghost'}
              className={styles.item}
              asChild
            >
              <Link href={href} onClick={handleNavigate}>
                <Icon className={styles.itemIcon} />
                {label}
              </Link>
            </Button>
          ))}
          <div className={styles.divider} />
          {MY_PAGE_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Button key={href} variant="ghost" className={styles.item} asChild>
              <Link href={href} onClick={handleNavigate}>
                <Icon className={styles.itemIcon} />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
