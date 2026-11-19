import Link from 'next/link';

import { categoryHref, type Category } from '@entities/question';
import { Card } from '@shared/ui/Card';

import { CATEGORY_CARD_STAGGER_MS } from '../../config/motion';

interface CategoryCardProps {
  category: Category;
  order: number;
}

export function CategoryCard({ category, order }: CategoryCardProps) {
  return (
    <Link
      href={categoryHref(category.slug)}
      className="animate-fade-in-up"
      style={{ animationDelay: `${order * CATEGORY_CARD_STAGGER_MS}ms` }}
    >
      <Card className="card-hover hover:border-primary/30 cursor-pointer h-full group">
        <Card.Header>
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
          </div>
          <Card.Title className="group-hover:text-primary transition-colors duration-200">{category.title}</Card.Title>
          <Card.Description className="text-sm leading-relaxed">{category.description}</Card.Description>
        </Card.Header>
      </Card>
    </Link>
  );
}
