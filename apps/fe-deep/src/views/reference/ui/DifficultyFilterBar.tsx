import Link from 'next/link';

import type { Difficulty } from '@entities/question';
import { Button } from '@shared/ui/Button';

import { DIFFICULTY_FILTERS } from '@views/reference/config/filters';
import { FIRST_PAGE } from '@views/reference/config/pagination';
import { buildListHref } from '@views/reference/lib/buildListHref';

interface DifficultyFilterBarProps {
  categorySlug: string;
  selected: Difficulty | undefined;
}

export function DifficultyFilterBar({ categorySlug, selected }: DifficultyFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="난이도 필터">
      {DIFFICULTY_FILTERS.map(({ value, label }) => {
        const isSelected = selected === value;
        return (
          <Button
            key={label}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            asChild={!isSelected}
            className="shadow-sm"
          >
            {isSelected ? (
              <span>{label}</span>
            ) : (
              <Link href={buildListHref(categorySlug, FIRST_PAGE, value)}>{label}</Link>
            )}
          </Button>
        );
      })}
    </div>
  );
}
