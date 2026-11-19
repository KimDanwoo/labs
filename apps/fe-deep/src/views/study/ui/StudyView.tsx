import { PageContainer } from '@shared/ui/PageContainer';
import { Suspense } from 'react';

import { toStudyDocSummary } from '../lib/studyDocSummary';
import { getStudyDocs } from '../model/server/studyDocs';
import { DEFAULT_STUDY_SORT } from '../model/services/studySort';
import { StudyDocBoard } from './StudyDocBoard';
import { StudyDocBoardView } from './StudyDocBoardView';

export async function StudyView() {
  const docs = (await getStudyDocs()).map(toStudyDocSummary);

  return (
    <PageContainer width="medium" className="space-y-6">
      <Suspense fallback={<StudyDocBoardView docs={docs} sort={DEFAULT_STUDY_SORT} />}>
        <StudyDocBoard docs={docs} />
      </Suspense>
    </PageContainer>
  );
}
