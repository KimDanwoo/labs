import { STUDY_SORT, STUDY_SORT_LABELS, type StudySort } from '@views/study/model/studySort';
import Link from 'next/link';

type StudySortTabsProps = {
  current: StudySort;
};

export function StudySortTabs({ current }: StudySortTabsProps) {
  return (
    <nav aria-label="정렬" className="inline-flex rounded-lg bg-muted p-1 text-sm">
      {Object.values(STUDY_SORT).map((sort) => (
        <Link
          key={sort}
          href={`/study?sort=${sort}`}
          aria-current={sort === current ? 'page' : undefined}
          className="rounded-md px-3 py-1 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        >
          {STUDY_SORT_LABELS[sort]}
        </Link>
      ))}
    </nav>
  );
}
