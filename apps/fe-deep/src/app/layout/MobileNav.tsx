'use client';

import { Sheet, SheetContent, SheetTitle } from '@shared/ui/Sheet';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { MAIN_NAV_ITEMS, MY_PAGE_NAV_ITEMS } from '../config/navigation';
import { isActivePath } from '../lib/isActivePath';
import { MobileNavLink } from './MobileNavLink';
import { MobileNavTrigger } from './MobileNavTrigger';

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const handleNavigate = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <MobileNavTrigger />
      <SheetContent side="right" className="w-[280px]">
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        <nav className="flex flex-col gap-1 mt-8 px-2">
          {MAIN_NAV_ITEMS.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              isActive={isActivePath(pathname, item.href)}
              onNavigate={handleNavigate}
            />
          ))}
          <div className="my-2 border-t" />
          {MY_PAGE_NAV_ITEMS.map((item) => (
            <MobileNavLink key={item.href} item={item} isActive={false} onNavigate={handleNavigate} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
