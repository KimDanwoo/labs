import { Card } from '@shared/ui';
import { countSteps, type StudyDoc } from '@views/study/model/parseHandbook';
import { getStudyDocs } from '@views/study/model/studyDocs';
import { StudyDevReload } from '@views/study/ui';
import Link from 'next/link';

export const metadata = { title: '면접 학습' };

const STUDY_SORT = { latest: 'latest', oldest: 'oldest' } as const;
type StudySort = (typeof STUDY_SORT)[keyof typeof STUDY_SORT];

const SORT_LABELS: Record<StudySort, string> = { latest: '최신순', oldest: '오래된순' };

interface AdminStudyListPageProps {
  searchParams: Promise<{ sort?: string }>;
}

function parseSort(value: string | undefined): StudySort {
  return value === STUDY_SORT.oldest ? STUDY_SORT.oldest : STUDY_SORT.latest;
}

/** 날짜 없는 문서는 정렬 방향과 무관하게 맨 뒤에 둔다. */
function sortDocs(docs: StudyDoc[], sort: StudySort): StudyDoc[] {
  const direction = sort === STUDY_SORT.latest ? -1 : 1;
  return [...docs].sort((a, b) => {
    if (!a.date || !b.date) return Number(!a.date) - Number(!b.date);
    return a.date.localeCompare(b.date) * direction;
  });
}

export default async function AdminStudyListPage({ searchParams }: AdminStudyListPageProps) {
  const sort = parseSort((await searchParams).sort);
  const docs = sortDocs(await getStudyDocs(), sort);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:py-12">
      <StudyDevReload />
      <div>
        <h1 className="text-2xl font-bold">면접 학습</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <code>content/study/</code>에 마크다운을 넣으면 학습 화면이 생깁니다. 날짜는 파일 맨 위{' '}
          <code>date: YYYY-MM-DD</code>로 적습니다.
        </p>
      </div>

      {docs.length === 0 ? (
        <Card>
          <Card.Content className="py-10 text-center text-sm text-muted-foreground">
            아직 문서가 없습니다. <code>content/study/이름.md</code>를 추가해주세요.
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-3">
          <nav aria-label="정렬" className="flex gap-1 text-sm">
            {Object.values(STUDY_SORT).map((option) => (
              <Link
                key={option}
                href={`/study?sort=${option}`}
                aria-current={option === sort ? 'page' : undefined}
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
              >
                {SORT_LABELS[option]}
              </Link>
            ))}
          </nav>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">문서</th>
                  <th className="p-3 text-right font-medium whitespace-nowrap">주제</th>
                  <th className="p-3 text-right font-medium whitespace-nowrap">카드</th>
                  <th className="p-3 text-right font-medium whitespace-nowrap">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {docs.map((doc) => (
                  <tr key={doc.slug} className="hover:bg-muted/30">
                    <td className="p-3">
                      <Link href={`/study/${doc.slug}`} className="break-keep font-medium hover:underline">
                        {doc.title}
                      </Link>
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">{doc.topics.length}</td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">{countSteps(doc)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                      {doc.date ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
