import {
  DIFFICULTY_CONFIG,
  DIFFICULTY_VALUES,
  type Difficulty,
  getAllCategories,
  getCategoryBySlug,
  getQuestionsByCategorySlugPaginated,
} from '@entities/question';
import { FeedbackForm } from '@features/feedback';
import { Button, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@shared/ui';
import { createClient } from '@supabase/supabase-js';
import { CategorySidebar, QuestionAccordion } from '@views/reference';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 86400;

const PAGE_SIZE = 10;

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string; difficulty?: string }>;
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return DIFFICULTY_VALUES.includes(value as Difficulty);
}

function buildHref(categorySlug: string, page: number, difficulty?: Difficulty): string {
  const query = new URLSearchParams();
  if (page > 1) query.set('page', String(page));
  if (difficulty) query.set('difficulty', difficulty);
  const qs = query.toString();
  return `/reference/${categorySlug}${qs ? `?${qs}` : ''}`;
}

export async function generateStaticParams() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const categories = await getAllCategories(supabase);
  return categories.map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const category = await getCategoryBySlug(categorySlug, supabase);
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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { page: pageParam, difficulty: difficultyParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const difficulty = isDifficulty(difficultyParam) ? difficultyParam : undefined;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const category = await getCategoryBySlug(categorySlug, supabase);
  if (!category) notFound();

  const [result, categories] = await Promise.all([
    getQuestionsByCategorySlugPaginated(categorySlug, page, PAGE_SIZE, supabase, difficulty),
    getAllCategories(supabase),
  ]);

  if (page > 1 && result.data.length === 0) notFound();

  const difficultyFilters: { value: Difficulty | undefined; label: string }[] = [
    { value: undefined, label: '전체' },
    ...DIFFICULTY_VALUES.map((value) => ({
      value: value as Difficulty | undefined,
      label: DIFFICULTY_CONFIG[value].label,
    })),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fedeep.kr';

  const faqSchema =
    result.data.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: result.data.map((q) => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: { '@type': 'Answer', text: q.answer.slice(0, 500) },
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
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 border border-border/60 rounded-xl shadow-sm">
            <CategorySidebar categories={categories} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-8">
            {/* Mobile sidebar trigger */}
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
                {result.total > 0 && <span className="ml-2 tabular-nums">({result.total}개 질문)</span>}
              </p>
              <FeedbackForm fixedType="add_question" label="질문 추가 요청" className="-ml-2 mt-1" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="난이도 필터">
            {difficultyFilters.map(({ value, label }) => (
              <Button
                key={label}
                variant={difficulty === value ? 'default' : 'outline'}
                size="sm"
                asChild={difficulty !== value}
                className="shadow-sm"
              >
                {difficulty === value ? (
                  <span>{label}</span>
                ) : (
                  <Link href={buildHref(categorySlug, 1, value)}>{label}</Link>
                )}
              </Button>
            ))}
          </div>

          {result.data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">이 난이도의 질문이 없습니다.</p>
          ) : (
            <QuestionAccordion questions={result.data} startIndex={(page - 1) * PAGE_SIZE} />
          )}

          {result.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-10" aria-label="페이지네이션">
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild className="shadow-sm">
                  <Link href={buildHref(categorySlug, page - 1, difficulty)}>
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="size-4" />
                </Button>
              )}

              {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === result.totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={page === item ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-8 tabular-nums shadow-sm"
                      asChild={page !== item}
                    >
                      {page === item ? (
                        <span>{item}</span>
                      ) : (
                        <Link href={buildHref(categorySlug, item, difficulty)}>{item}</Link>
                      )}
                    </Button>
                  ),
                )}

              {page < result.totalPages ? (
                <Button variant="outline" size="sm" asChild className="shadow-sm">
                  <Link href={buildHref(categorySlug, page + 1, difficulty)}>
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
