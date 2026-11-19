import { PageContainer } from '@shared/ui/PageContainer';
import { Suspense } from 'react';

import type { CategoryPageProps } from '../../model/server/categoryRoute';
import { loadCategoryPage } from '../../model/server/loadCategoryPage';
import { CategoryQuestionList } from '../CategoryQuestionList';
import { CategorySidebar } from '../CategorySidebar';
import { QuestionAccordion } from '../QuestionAccordion';
import { CategoryHeader } from './CategoryHeader';
import { CategorySchemas } from './CategorySchemas';
import { ReferenceDetailLayout } from './ReferenceDetailLayout';

export async function ReferenceDetailView({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { category, categories, questions, firstPage } = await loadCategoryPage(categorySlug);

  return (
    <PageContainer width="wide" enter="fade">
      <CategorySchemas category={category} firstPage={firstPage} />
      <ReferenceDetailLayout sidebar={<CategorySidebar categories={categories} />}>
        <CategoryHeader category={category} categories={categories} questionCount={questions.length} />
        <Suspense fallback={<QuestionAccordion questions={firstPage} />}>
          <CategoryQuestionList categorySlug={categorySlug} questions={questions} />
        </Suspense>
      </ReferenceDetailLayout>
    </PageContainer>
  );
}
