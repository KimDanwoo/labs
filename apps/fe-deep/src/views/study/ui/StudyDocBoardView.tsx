import { Card } from '@shared/ui/Card';

import type { StudyDocSummary } from '../lib/studyDocSummary';
import { sortStudyDocs, type StudySort } from '../model/services/studySort';
import { StudyDocTable } from './doc-table/StudyDocTable';
import { StudySortTabs } from './StudySortTabs';

interface StudyDocBoardViewProps {
  docs: StudyDocSummary[];
  sort: StudySort;
}

export function StudyDocBoardView({ docs, sort }: StudyDocBoardViewProps) {
  return (
    <>
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
        <StudyDocTable docs={sortStudyDocs(docs, sort)} />
      )}
    </>
  );
}
