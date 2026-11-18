import type { StudyDoc } from '../../lib/parseHandbook';
import { StudyDocRow } from './StudyDocRow';

interface StudyDocTableProps {
  docs: StudyDoc[];
}

export function StudyDocTable({ docs }: StudyDocTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="px-5 py-3 text-left font-normal">문서</th>
            <th className="hidden w-20 px-3 py-3 text-right font-normal sm:table-cell">주제</th>
            <th className="hidden w-20 px-3 py-3 text-right font-normal sm:table-cell">카드</th>
            <th className="w-28 px-3 py-3 text-right font-normal">날짜</th>
            <th className="w-10" aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y">
          {docs.map((doc) => (
            <StudyDocRow key={doc.slug} doc={doc} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
