'use client';

import { Button } from '@shared/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/DropdownMenu';
import { User } from 'lucide-react';
import Link from 'next/link';

import { MY_PAGE_NAV_ITEMS } from '@app/config/navigation';

export function MyPageMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="내 학습 메뉴">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MY_PAGE_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem asChild key={href}>
            <Link href={href}>
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
