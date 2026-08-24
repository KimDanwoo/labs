import { StudyRunView } from '@views/study';
import { getStudyDoc, getStudyDocSlugs } from '@views/study/model/studyDocs';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

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

export default async function StudyDocPage({ params }: StudyDocPageProps) {
  const { slug } = await params;
  const doc = await getStudyDoc(slug);
  if (!doc) notFound();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <StudyRunView doc={doc} />
    </div>
  );
}
