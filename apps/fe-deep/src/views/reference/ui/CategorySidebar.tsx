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
    <ScrollArea type="scroll" className="max-h-[calc(100vh-8rem)]">
      <nav className="flex flex-col gap-1 p-2">
        {categories.map((category) => {
          const href = categoryHref(category.slug);
          return (
            <Link
              key={category.id}
              href={href}
              className={cn(styles.link.base, pathname === href ? styles.link.active : styles.link.inactive)}
            >
              <span className="text-base">{category.icon}</span>
              <span className="truncate">{category.title}</span>
            </Link>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
