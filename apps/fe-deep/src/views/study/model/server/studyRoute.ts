import { getStudyDoc, getStudyDocSlugs } from './studyDocs';

export interface StudyDocPageProps {
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
