import { getStudyDoc, getStudyDocSlugs } from '@views/study/model/server';
import { StudyDevReload, StudyRunView } from '@views/study/ui';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

interface StudyDocPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getStudyDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: StudyDocPageProps) {
  const { slug } = await params;
  const doc = await getStudyDoc(slug);
  return { title: doc?.title ?? '면접 학습' };
}

export async function StudyDetailView({ params }: StudyDocPageProps) {
  const { slug } = await params;
  const doc = await getStudyDoc(slug);
  if (!doc) notFound();

  return (
    <div className="container mx-auto max-w-168 px-4 py-6 sm:py-10">
      <StudyDevReload />
      <Suspense>
        <StudyRunView doc={doc} />
      </Suspense>
    </div>
  );
}
