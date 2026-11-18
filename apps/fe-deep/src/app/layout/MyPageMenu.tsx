'use client';

import { Button } from '@shared/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/DropdownMenu';
import { User } from 'lucide-react';
import Link from 'next/link';

import { MY_PAGE_NAV_ITEMS } from '../config/navigation';
import { styles } from './MyPageMenu.styles';

export function MyPageMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={styles.trigger} aria-label="내 학습 메뉴">
          <User className={styles.triggerIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MY_PAGE_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem asChild key={href}>
            <Link href={href}>
              <Icon className={styles.itemIcon} />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
