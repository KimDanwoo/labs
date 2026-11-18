'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Category } from '@entities/question';
import { cn } from '@shared/lib/cn';
import { ScrollArea } from '@shared/ui/ScrollArea';

import { categoryHref } from '../lib/categoryHref';
import { styles } from './CategorySidebar.styles';

interface CategorySidebarProps {
  categories: Category[];
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const pathname = usePathname();

  return (
    <ScrollArea type="scroll" className={styles.scroller}>
      <nav className={styles.nav}>
        {categories.map((category) => {
          const href = categoryHref(category.slug);
          return (
            <Link
              key={category.id}
              href={href}
              className={cn(styles.link.base, pathname === href ? styles.link.active : styles.link.inactive)}
            >
              <span className={styles.icon}>{category.icon}</span>
              <span className={styles.title}>{category.title}</span>
            </Link>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
