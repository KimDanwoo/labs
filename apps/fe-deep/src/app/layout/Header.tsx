'use client';

import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/DropdownMenu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';
import { ThemeToggle } from '@shared/ui/ThemeToggle';
import { Bookmark, BookOpen, GraduationCap, Menu, NotebookPen, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/reference', label: '레퍼런스', icon: BookOpen },
  { href: '/learn', label: '학습', icon: GraduationCap },
  { href: '/search', label: '검색', icon: Search },
  { href: '/study', label: '면접 학습', icon: NotebookPen },
];

const myPageItems = [
  { href: '/mypage/progress', label: '학습 현황', icon: User },
  { href: '/mypage/bookmarks', label: '북마크', icon: Bookmark },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur',
        'supports-backdrop-filter:bg-background/60',
      )}
    >
      <div className="container flex h-14 items-center px-4 mx-auto max-w-7xl">
        <Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
          <span className="hidden sm:inline-block">프딥</span>
          <span className="sm:hidden">프딥</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1 flex-1" aria-label="메인 네비게이션">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button variant={isActive ? 'secondary' : 'ghost'} size="sm" className="gap-2" asChild key={item.href}>
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="내 학습 메뉴">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {myPageItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem asChild key={item.href}>
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="메뉴 열기">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetTitle className="sr-only">메뉴</SheetTitle>
              <nav className="flex flex-col gap-1 mt-8 px-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-3"
                      asChild
                      key={item.href}
                    >
                      <Link href={item.href} onClick={() => setOpen(false)}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
                <div className="my-2 border-t" />
                {myPageItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button variant="ghost" className="w-full justify-start gap-3" asChild key={item.href}>
                      <Link href={item.href} onClick={() => setOpen(false)}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
