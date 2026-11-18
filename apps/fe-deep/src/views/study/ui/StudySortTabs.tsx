import Link from 'next/link';

import { studySortHref } from '../lib/studyHref';
import { STUDY_SORT, STUDY_SORT_LABELS, type StudySort } from '../model/services/studySort';
import { styles } from './StudySortTabs.styles';

interface StudySortTabsProps {
  current: StudySort;
}

export function StudySortTabs({ current }: StudySortTabsProps) {
  return (
    <nav aria-label="정렬" className={styles.nav}>
      {Object.values(STUDY_SORT).map((sort) => (
        <Link
          key={sort}
          href={studySortHref(sort)}
          aria-current={sort === current ? 'page' : undefined}
          className={styles.tab}
        >
          {STUDY_SORT_LABELS[sort]}
        </Link>
      ))}
    </nav>
  );
}
