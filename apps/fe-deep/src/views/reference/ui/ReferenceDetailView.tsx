import { findCategoryBySlug, questionsInCategory } from '@entities/question';
import { loadQuestionContent } from '@entities/question/index.server';
import { SITE_URL } from '@shared/config/site';
import { Button } from '@shared/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui/Sheet';
import { Menu } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CategoryQuestionList, QUESTIONS_PER_PAGE } from './CategoryQuestionList';
import { CategorySidebar } from './CategorySidebar';
import { QuestionAccordion } from './QuestionAccordion';

const FAQ_ANSWER_LENGTH = 500;

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function generateStaticParams() {
  const { categories } = await loadQuestionContent();
  return categories.map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = findCategoryBySlug(await loadQuestionContent(), categorySlug);
  if (!category) return {};

  return {
    title: `${category.title} - 레퍼런스`,
    description: category.description || `${category.title} 관련 프론트엔드 면접 질문과 답변 모음`,
    openGraph: {
      title: `${category.title} - 프딥 레퍼런스`,
      description: category.description || `${category.title} 관련 프론트엔드 면접 질문과 답변 모음`,
    },
  };
}

export async function ReferenceDetailView({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const content = await loadQuestionContent();
  const category = findCategoryBySlug(content, categorySlug);
  if (!category) notFound();

  const { categories } = content;
  const questions = questionsInCategory(content, category.id);
  const firstPage = questions.slice(0, QUESTIONS_PER_PAGE);

  const siteUrl = SITE_URL;

  const faqSchema =
    firstPage.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: firstPage.map((q) => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: { '@type': 'Answer', text: q.answer.slice(0, FAQ_ANSWER_LENGTH) },
          })),
        }
      : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '레퍼런스', item: `${siteUrl}/reference` },
      { '@type': 'ListItem', position: 3, name: category.title, item: `${siteUrl}/reference/${categorySlug}` },
    ],
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12 animate-fade-in">
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }} />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 border border-border/60 rounded-xl shadow-sm">
            <CategorySidebar categories={categories} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-8">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="카테고리 메뉴 열기"
                  className="shadow-sm shrink-0 mt-1"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">카테고리 목록</SheetTitle>
                <div className="pt-8">
                  <CategorySidebar categories={categories} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-2xl">{category.icon}</span>
                <h1 className="text-2xl font-bold tracking-tight">{category.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {category.description}
                {questions.length > 0 && <span className="ml-2 tabular-nums">({questions.length}개 질문)</span>}
              </p>
            </div>
          </div>

          <Suspense fallback={<QuestionAccordion questions={firstPage} />}>
            <CategoryQuestionList categorySlug={categorySlug} questions={questions} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
