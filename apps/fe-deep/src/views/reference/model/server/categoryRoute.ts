import type { Metadata, ResolvingMetadata } from 'next';

import { findCategoryBySlug } from '@entities/question';
import { loadQuestionContent } from '@entities/question/index.server';

export interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateStaticParams() {
  const { categories } = await loadQuestionContent();
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = findCategoryBySlug(await loadQuestionContent(), categorySlug);
  if (!category) return {};

  const description = category.description || `${category.title} 관련 프론트엔드 면접 질문과 답변 모음`;
  return {
    title: `${category.title} - 레퍼런스`,
    description,
    alternates: { canonical: `/reference/${category.slug}` },
    openGraph: { title: `${category.title} - 프딥 레퍼런스`, description, images: (await parent).openGraph?.images },
  };
}
