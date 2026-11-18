import { List } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';

import { STUDY_LIST_HREF } from '../../lib/studyHref';
import { styles } from './StudyRunner.styles';

interface RunnerHeaderProps {
  docTitle: string;
  topicTitle: string;
  topicPosition: number;
  topicCount: number;
  doneSteps: number;
  totalSteps: number;
  toc: ReactNode;
}

export function RunnerHeader({
  docTitle,
  topicTitle,
  topicPosition,
  topicCount,
  doneSteps,
  totalSteps,
  toc,
}: RunnerHeaderProps) {
  return (
    <div className={styles.header}>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="주제 목차 열기" className={styles.tocButton}>
            <List className={styles.tocIcon} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={styles.tocSheet}>
          <SheetTitle className="sr-only">주제 목차</SheetTitle>
          <div className={styles.tocBody}>{toc}</div>
        </SheetContent>
      </Sheet>

      <div className={styles.titleBlock}>
        <Link href={STUDY_LIST_HREF} className={styles.docLink}>
          {docTitle}
        </Link>
        <p className={styles.topicTitle}>
          <span className={styles.topicPosition}>
            {topicPosition}/{topicCount}
          </span>{' '}
          {topicTitle}
        </p>
      </div>

      <span className={styles.stepCounter}>
        {doneSteps}/{totalSteps}
      </span>
    </div>
  );
}
