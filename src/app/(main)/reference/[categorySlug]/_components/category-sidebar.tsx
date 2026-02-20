'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { ScrollArea } from '@/shared/ui/scroll-area';
import type { Category } from '@/entities/question';

interface CategorySidebarProps {
  categories: Category[];
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const pathname = usePathname();

  return (
    <ScrollArea className="max-h-[calc(100vh-8rem)]">
      <nav className="flex flex-col gap-1 p-2">
        {categories.map((category) => {
          const isActive = pathname === `/reference/${category.slug}`;
          return (
            <Link
              key={category.id}
              href={`/reference/${category.slug}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
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
