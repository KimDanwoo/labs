import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getAllCategories, getCategoryBySlug, getQuestionsByCategorySlugPaginated } from '@/entities/question';
import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { CategorySidebar, QuestionAccordion } from '@/views/reference';

export const revalidate = 86400;

const PAGE_SIZE = 10;

interface CategoryPageProps {
	params: Promise<{ categorySlug: string }>;
	searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
	const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
	const categories = await getAllCategories(supabase);
	return categories.map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
	const { categorySlug } = await params;
	const supabase = await createServerSupabaseClient();
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
	const { page: pageParam } = await searchParams;
	const page = Math.max(1, Number(pageParam) || 1);

	const supabase = await createServerSupabaseClient();

	const category = await getCategoryBySlug(categorySlug, supabase);
	if (!category) notFound();

	const [result, categories] = await Promise.all([
		getQuestionsByCategorySlugPaginated(categorySlug, page, PAGE_SIZE, supabase),
		getAllCategories(supabase),
	]);

	if (page > 1 && result.data.length === 0) notFound();

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fedeep.kr';

	const faqSchema = result.data.length > 0 ? {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: result.data.map((q) => ({
			'@type': 'Question',
			name: q.question,
			acceptedAnswer: { '@type': 'Answer', text: q.answer.slice(0, 500) },
		})),
	} : null;

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
		<div className="container mx-auto max-w-7xl px-4 pt-6 pb-24">
			{faqSchema && (
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
			)}
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

			<div className="flex gap-6">
				{/* Desktop sidebar */}
				<aside className="hidden lg:block w-64 shrink-0">
					<div className="sticky top-20 border rounded-lg">
						<CategorySidebar categories={categories} />
					</div>
				</aside>

				{/* Main content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-3 mb-6">
						{/* Mobile sidebar trigger */}
						<Sheet>
							<SheetTrigger asChild className="lg:hidden">
								<Button variant="outline" size="icon" aria-label="카테고리 메뉴 열기">
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

						<div>
							<div className="flex items-center gap-2 mb-1">
								<span className="text-2xl">{category.icon}</span>
								<h1 className="text-2xl font-bold">{category.title}</h1>
							</div>
							<p className="text-sm text-muted-foreground">
								{category.description}
								{result.total > 0 && <span className="ml-2">({result.total}개 질문)</span>}
							</p>
						</div>
					</div>

					<QuestionAccordion questions={result.data} startIndex={(page - 1) * PAGE_SIZE} />

					{result.totalPages > 1 && (
						<nav className="flex items-center justify-center gap-2 mt-8" aria-label="페이지네이션">
							{page > 1 ? (
								<Button variant="outline" size="sm" asChild>
									<Link href={`/reference/${categorySlug}?page=${page - 1}`}>
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
											className="min-w-8"
											asChild={page !== item}
										>
											{page === item ? (
												<span>{item}</span>
											) : (
												<Link href={`/reference/${categorySlug}${item === 1 ? '' : `?page=${item}`}`}>{item}</Link>
											)}
										</Button>
									),
								)}

							{page < result.totalPages ? (
								<Button variant="outline" size="sm" asChild>
									<Link href={`/reference/${categorySlug}?page=${page + 1}`}>
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
