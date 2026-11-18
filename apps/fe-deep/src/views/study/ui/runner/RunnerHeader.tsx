import { List } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';

import { STUDY_LIST_HREF } from '../../lib/studyHref';

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
    <div className="mb-3 flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="주제 목차 열기" className="shrink-0">
            <List className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto p-0">
          <SheetTitle className="sr-only">주제 목차</SheetTitle>
          <div className="pt-8">{toc}</div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0">
        <Link href={STUDY_LIST_HREF} className="text-xs text-muted-foreground hover:text-foreground">
          {docTitle}
        </Link>
        <p className="truncate text-sm font-normal">
          <span className="tabular-nums text-muted-foreground">
            {topicPosition}/{topicCount}
          </span>{' '}
          {topicTitle}
        </p>
      </div>

      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
        {doneSteps}/{totalSteps}
      </span>
    </div>
  );
}
