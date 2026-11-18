import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getStudyDoc } from '../model/server/studyDocs';
import type { StudyDocPageProps } from '../model/server/studyRoute';
import { StudyRunView } from './runner/StudyRunView';
import { styles } from './StudyDetailView.styles';
import { StudyDevReload } from './StudyDevReload';

export async function StudyDetailView({ params }: StudyDocPageProps) {
  const { slug } = await params;
  const doc = await getStudyDoc(slug);
  if (!doc) notFound();

  return (
    <div className={styles.root}>
      <StudyDevReload />
      <Suspense>
        <StudyRunView doc={doc} />
      </Suspense>
    </div>
  );
}
