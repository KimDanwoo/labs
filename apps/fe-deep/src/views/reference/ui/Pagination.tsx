import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import type { Difficulty } from '@entities/question';
import { Button } from '@shared/ui/Button';

import { FIRST_PAGE, PAGE_ELLIPSIS } from '../config/pagination';
import { buildListHref } from '../lib/buildListHref';
import { buildPageItems } from '../lib/buildPageItems';
import { PageStepButton } from './PageStepButton';

interface PaginationProps {
  categorySlug: string;
  page: number;
  totalPages: number;
  difficulty: Difficulty | undefined;
}

export function Pagination({ categorySlug, page, totalPages, difficulty }: PaginationProps) {
  const hrefFor = (target: number) => buildListHref(categorySlug, target, difficulty);

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="페이지네이션">
      <PageStepButton href={page > FIRST_PAGE ? hrefFor(page - 1) : null} label="이전 페이지" Icon={ChevronLeft} />

      {buildPageItems(totalPages, page).map((item, index) =>
        item === PAGE_ELLIPSIS ? (
          <span key={`e-${index}`} className="px-1 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={item}
            variant={page === item ? 'default' : 'outline'}
            size="sm"
            className="min-w-8 tabular-nums shadow-sm"
            asChild={page !== item}
          >
            {page === item ? <span>{item}</span> : <Link href={hrefFor(item)}>{item}</Link>}
          </Button>
        ),
      )}

      <PageStepButton href={page < totalPages ? hrefFor(page + 1) : null} label="다음 페이지" Icon={ChevronRight} />
    </nav>
  );
}
