import { PageContainer } from '@shared/ui/PageContainer';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { findCategoryBySlug, questionsInCategory } from '@entities/question';
import { loadQuestionContent } from '@entities/question/index.server';
import { SITE_URL } from '@shared/config/site';

import { QUESTIONS_PER_PAGE } from '../../config/pagination';
import { buildBreadcrumbSchema, buildFaqSchema } from '../../lib/structuredData';
import type { CategoryPageProps } from '../../model/server/categoryRoute';
import { CategoryQuestionList } from '../CategoryQuestionList';
import { CategorySidebar } from '../CategorySidebar';
import { QuestionAccordion } from '../QuestionAccordion';
import { CategoryHeading } from './CategoryHeading';
import { JsonLdScript } from './JsonLdScript';
import { MobileCategoryMenu } from './MobileCategoryMenu';

export async function ReferenceDetailView({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const content = await loadQuestionContent();
  const category = findCategoryBySlug(content, categorySlug);
  if (!category) notFound();

  const { categories } = content;
  const questions = questionsInCategory(content, category.id);
  const firstPage = questions.slice(0, QUESTIONS_PER_PAGE);
  const faqSchema = buildFaqSchema(firstPage);

  return (
    <PageContainer width="wide" enter="fade">
      {faqSchema && <JsonLdScript data={faqSchema} />}
      <JsonLdScript data={buildBreadcrumbSchema(SITE_URL, category)} />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 border border-border/60 rounded-xl shadow-sm">
            <CategorySidebar categories={categories} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-8">
            <MobileCategoryMenu categories={categories} />
            <CategoryHeading category={category} questionCount={questions.length} />
          </div>

          <Suspense fallback={<QuestionAccordion questions={firstPage} />}>
            <CategoryQuestionList categorySlug={categorySlug} questions={questions} />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
