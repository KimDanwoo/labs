import { Card } from '@shared/ui';
import { getStudyDocs } from '@views/study/model/studyDocs';
import { parseStudySort, sortStudyDocs } from '@views/study/model/studySort';
import { StudyDevReload, StudyDocTable, StudySortTabs } from '@views/study/ui';

export const metadata = { title: '면접 학습' };

interface AdminStudyListPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function AdminStudyListPage({ searchParams }: AdminStudyListPageProps) {
  const sort = parseStudySort((await searchParams).sort);
  const docs = sortStudyDocs(await getStudyDocs(), sort);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8 sm:py-12">
      <StudyDevReload />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">면접 학습</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            문서 {docs.length}개 · <code>content/study/</code> 마크다운, 맨 위 <code>date: YYYY-MM-DD</code>로 정렬
          </p>
        </div>
        {docs.length > 0 && <StudySortTabs current={sort} />}
      </div>

      {docs.length === 0 ? (
        <Card>
          <Card.Content className="py-10 text-center text-sm text-muted-foreground">
            아직 문서가 없습니다. <code>content/study/이름.md</code>를 추가해주세요.
          </Card.Content>
        </Card>
      ) : (
        <StudyDocTable docs={docs} />
      )}
    </div>
  );
}
