'use client';

import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { MAIN_NAV_ITEMS, MY_PAGE_NAV_ITEMS } from '../config/navigation';
import { isActivePath } from '../lib/isActivePath';

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const handleNavigate = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" aria-label="메뉴 열기">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        <nav className="flex flex-col gap-1 mt-8 px-2">
          {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant={isActivePath(pathname, href) ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              asChild
            >
              <Link href={href} onClick={handleNavigate}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
          <div className="my-2 border-t" />
          {MY_PAGE_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Button key={href} variant="ghost" className="w-full justify-start gap-3" asChild>
              <Link href={href} onClick={handleNavigate}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
