import { ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

import { formatStudyDate } from '../../lib/formatStudyDate';
import { countSteps } from '../../lib/parseHandbook';
import { type StudyDoc } from '../../lib/studyDoc';
import { studyDocHref } from '../../lib/studyHref';

interface StudyDocRowProps {
  doc: StudyDoc;
}

export function StudyDocRow({ doc }: StudyDocRowProps) {
  const stepCount = countSteps(doc);

  return (
    <tr className="group relative transition-colors hover:bg-muted/40">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <Link
              href={studyDocHref(doc.slug)}
              className="break-keep font-normal after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline"
            >
              {doc.title}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums sm:hidden">
              주제 {doc.topics.length} · 카드 {stepCount}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-4 text-right tabular-nums text-muted-foreground sm:table-cell">
        {doc.topics.length}
      </td>
      <td className="hidden px-3 py-4 text-right tabular-nums text-muted-foreground sm:table-cell">{stepCount}</td>
      <td className="px-3 py-4 text-right tabular-nums whitespace-nowrap text-muted-foreground">
        {formatStudyDate(doc.date)}
      </td>
      <td className="pr-4 text-muted-foreground/50">
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </td>
    </tr>
  );
}
