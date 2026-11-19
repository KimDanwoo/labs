import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getStudyDoc } from '../model/server/studyDocs';
import type { StudyDocPageProps } from '../model/server/studyRoute';
import { StudyRunView } from './runner/StudyRunView';

export async function StudyDetailView({ params }: StudyDocPageProps) {
  const { slug } = await params;
  const doc = await getStudyDoc(slug);
  if (!doc) notFound();

  return (
    <div className="container mx-auto max-w-168 px-4 py-6 sm:py-10">
      <Suspense>
        <StudyRunView doc={doc} />
      </Suspense>
    </div>
  );
}
