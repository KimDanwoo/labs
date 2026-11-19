import Link from 'next/link';

import { categoryHref, type Category } from '@entities/question';

interface CategoryChipProps {
  category: Category;
}

export function CategoryChip({ category }: CategoryChipProps) {
  return (
    <Link href={categoryHref(category.slug)} prefetch={false}>
      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all duration-200">
        <span className="text-base">{category.icon}</span>
        {category.title}
      </span>
    </Link>
  );
}
