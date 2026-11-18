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
import { styles } from './ReferenceDetailView.styles';

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
    <div className={styles.root}>
      {faqSchema && <JsonLdScript data={faqSchema} />}
      <JsonLdScript data={buildBreadcrumbSchema(SITE_URL, category)} />

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <div className={styles.asideCard}>
            <CategorySidebar categories={categories} />
          </div>
        </aside>

        <div className={styles.main}>
          <div className={styles.heading}>
            <MobileCategoryMenu categories={categories} />
            <CategoryHeading category={category} questionCount={questions.length} />
          </div>

          <Suspense fallback={<QuestionAccordion questions={firstPage} />}>
            <CategoryQuestionList categorySlug={categorySlug} questions={questions} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
