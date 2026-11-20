import Link from 'next/link';

import { SITE_NAME } from '@app/config/navigation';
import { DesktopNav } from '@app/layout/DesktopNav';
import { MobileNav } from '@app/layout/MobileNav';
import { MyPageMenu } from '@app/layout/MyPageMenu';
import { ThemeToggle } from '@app/layout/theme-toggle/ThemeToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center px-4 mx-auto max-w-7xl">
        <Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
          <span className="hidden sm:inline-block">{SITE_NAME}</span>
          <span className="sm:hidden">{SITE_NAME}</span>
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <MyPageMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
