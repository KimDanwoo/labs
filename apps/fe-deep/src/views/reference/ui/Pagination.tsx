import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import type { Difficulty } from '@entities/question';
import { Button } from '@shared/ui/Button';

import { FIRST_PAGE, PAGE_ELLIPSIS } from '@views/reference/config/pagination';
import { buildListHref } from '@views/reference/lib/buildListHref';
import { buildPageItems } from '@views/reference/lib/buildPageItems';
import { PageStepButton } from '@views/reference/ui/PageStepButton';

interface PaginationProps {
  categorySlug: string;
  page: number;
  totalPages: number;
  difficulty: Difficulty | undefined;
}

export function Pagination({ categorySlug, page, totalPages, difficulty }: PaginationProps) {
  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="페이지네이션">
      <PageStepButton
        href={page > FIRST_PAGE ? buildListHref(categorySlug, page - 1, difficulty) : null}
        label="이전 페이지"
        Icon={ChevronLeft}
      />

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
            {page === item ? (
              <span>{item}</span>
            ) : (
              <Link href={buildListHref(categorySlug, item, difficulty)}>{item}</Link>
            )}
          </Button>
        ),
      )}

      <PageStepButton
        href={page < totalPages ? buildListHref(categorySlug, page + 1, difficulty) : null}
        label="다음 페이지"
        Icon={ChevronRight}
      />
    </nav>
  );
}
