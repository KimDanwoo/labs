import { countSteps, type StudyDoc } from '@views/study/model/parseHandbook';
import { ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

type StudyDocTableProps = {
  docs: StudyDoc[];
};

const formatDate = (date: string) => date.replaceAll('-', '.');

export function StudyDocTable({ docs }: StudyDocTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="px-5 py-3 text-left font-medium">문서</th>
            <th className="hidden w-20 px-3 py-3 text-right font-medium sm:table-cell">주제</th>
            <th className="hidden w-20 px-3 py-3 text-right font-medium sm:table-cell">카드</th>
            <th className="w-28 px-3 py-3 text-right font-medium">날짜</th>
            <th className="w-10" aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y">
          {docs.map((doc) => (
            <tr key={doc.slug} className="group relative transition-colors hover:bg-muted/40">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/study/${doc.slug}`}
                      className="break-keep font-medium after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline"
                    >
                      {doc.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums sm:hidden">
                      주제 {doc.topics.length} · 카드 {countSteps(doc)}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-4 text-right tabular-nums text-muted-foreground sm:table-cell">
                {doc.topics.length}
              </td>
              <td className="hidden px-3 py-4 text-right tabular-nums text-muted-foreground sm:table-cell">
                {countSteps(doc)}
              </td>
              <td className="px-3 py-4 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                {doc.date ? formatDate(doc.date) : '—'}
              </td>
              <td className="pr-4 text-muted-foreground/50">
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
