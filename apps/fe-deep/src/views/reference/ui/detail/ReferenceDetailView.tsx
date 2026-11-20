import { PageContainer } from '@shared/ui/PageContainer';
import { Suspense } from 'react';

import type { CategoryPageProps } from '@views/reference/model/server/categoryRoute';
import { loadCategoryPage } from '@views/reference/model/server/loadCategoryPage';
import { CategoryQuestionList } from '@views/reference/ui/CategoryQuestionList';
import { CategorySidebar } from '@views/reference/ui/CategorySidebar';
import { QuestionAccordion } from '@views/reference/ui/QuestionAccordion';
import { CategoryHeader } from '@views/reference/ui/detail/CategoryHeader';
import { CategorySchemas } from '@views/reference/ui/detail/CategorySchemas';
import { ReferenceDetailLayout } from '@views/reference/ui/detail/ReferenceDetailLayout';

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
