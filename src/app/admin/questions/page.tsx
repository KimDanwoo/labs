'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@shared/config/supabase/client';
import type { Question, Category, QuestionVisibilityField } from '@entities/question/model';
import { useDebounce } from '@shared/lib/hooks';
import { Button } from '@shared/ui';
import {
	deleteQuestion,
	deleteQuestions,
	updateQuestionsVisibility,
	updateCategoryVisibility,
} from '@entities/question/services';
import { Plus, Trash2, BookOpen, BookOpenCheck, Layers, Eye, EyeOff, FolderSync } from 'lucide-react';
import { QuestionFilters } from './_ui/QuestionFilters';
import { QuestionTable } from './_ui/QuestionTable';
import { Pagination } from './_ui/Pagination';

const PAGE_SIZE = 10;

export default function QuestionsListPage() {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 300);
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// 페이지·필터 변경 시 선택 초기화
	useEffect(() => {
		setPage(1);
		setSelectedIds(new Set());
	}, [debouncedSearch, categoryFilter, difficultyFilter]);

	useEffect(() => {
		setSelectedIds(new Set());
	}, [page]);

	// 카테고리 최초 로드
	useEffect(() => {
		const supabase = createClient();
		supabase
			.from('categories')
			.select('id, slug, title, order_num, icon, description')
			.order('order_num')
			.then(({ data }) => setCategories((data ?? []) as Category[]));
	}, []);

	// 질문 서버사이드 페이징 조회
	const fetchQuestions = useCallback(async (signal?: AbortSignal) => {
		setLoading(true);
		try {
			const supabase = createClient();

			let query = supabase
				.from('questions')
				.select(
					'id, category_id, question, answer, sub_category, difficulty, order_num, tags, show_in_daily, show_in_flashcard',
					{ count: 'exact' }
				)
				.order('order_num');

			if (categoryFilter !== 'all') {
				query = query.eq('category_id', categoryFilter);
			}
			if (difficultyFilter !== 'all') {
				query = query.eq('difficulty', difficultyFilter);
			}
			if (debouncedSearch) {
				query = query.or(
					`question.ilike.%${debouncedSearch}%,tags.cs.{${debouncedSearch}}`
				);
			}

			const from = (page - 1) * PAGE_SIZE;
			const to = from + PAGE_SIZE - 1;
			query = query.range(from, to);

			if (signal) query = query.abortSignal(signal);

			const { data, count, error } = await query;
			if (error) throw error;
			setQuestions((data ?? []) as Question[]);
			setTotalCount(count ?? 0);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			console.error('질문 조회 실패:', err);
		} finally {
			setLoading(false);
		}
	}, [page, categoryFilter, difficultyFilter, debouncedSearch]);

	useEffect(() => {
		const controller = new AbortController();
		fetchQuestions(controller.signal);
		return () => controller.abort();
	}, [fetchQuestions]);

	const categoryMap = useMemo(
		() => new Map(categories.map((c) => [c.id, c])),
		[categories]
	);

	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	async function handleDelete(id: string) {
		if (!confirm('정말 삭제하시겠습니까?')) return;
		try {
			await deleteQuestion(id);
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			fetchQuestions(undefined);
		} catch (e) {
			alert(e instanceof Error ? e.message : '삭제 실패');
		}
	}

	async function handleBulkDelete() {
		const count = selectedIds.size;
		if (count === 0) return;
		if (!confirm(`선택한 ${count}개 질문을 삭제하시겠습니까?`)) return;
		try {
			await deleteQuestions(Array.from(selectedIds));
			setSelectedIds(new Set());
			fetchQuestions(undefined);
		} catch (e) {
			alert(e instanceof Error ? e.message : '일괄 삭제 실패');
		}
	}

	async function handleBulkVisibility(
		field: QuestionVisibilityField,
		value: boolean,
	) {
		if (selectedIds.size === 0) return;
		try {
			await updateQuestionsVisibility(Array.from(selectedIds), {
				[field]: value,
			});
			setSelectedIds(new Set());
			fetchQuestions(undefined);
		} catch (e) {
			alert(e instanceof Error ? e.message : '노출 설정 변경 실패');
		}
	}

	async function handleCategoryVisibility(
		field: QuestionVisibilityField,
		value: boolean,
	) {
		if (categoryFilter === 'all') {
			alert('카테고리를 먼저 선택해 주세요.');
			return;
		}
		const cat = categoryMap.get(categoryFilter);
		const label = field === 'show_in_daily' ? '오늘학습' : '플래시카드';
		const action = value ? 'ON' : 'OFF';
		if (!confirm(`"${cat?.title ?? categoryFilter}" 카테고리 전체 질문을 ${label} ${action}하시겠습니까?`)) return;
		try {
			await updateCategoryVisibility(categoryFilter, { [field]: value });
			setSelectedIds(new Set());
			fetchQuestions(undefined);
		} catch (e) {
			alert(e instanceof Error ? e.message : '카테고리 노출 설정 변경 실패');
		}
	}

	const hasSelection = selectedIds.size > 0;

	const selectedQuestions = useMemo(
		() => questions.filter((q) => selectedIds.has(q.id)),
		[questions, selectedIds],
	);
	const dailyOnCount = selectedQuestions.filter((q) => q.show_in_daily).length;
	const flashcardOnCount = selectedQuestions.filter((q) => q.show_in_flashcard).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">질문 관리</h1>
				<Button asChild size="sm">
					<Link href="/admin/questions/new">
						<Plus className="size-4 mr-1" />새 질문
					</Link>
				</Button>
			</div>

			<QuestionFilters
				search={search}
				onSearchChange={setSearch}
				categoryFilter={categoryFilter}
				onCategoryFilterChange={setCategoryFilter}
				difficultyFilter={difficultyFilter}
				onDifficultyFilterChange={setDifficultyFilter}
				categories={categories}
			/>

			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{totalCount}개 질문 (페이지 {page}/{totalPages})
					{hasSelection && (
						<span className="ml-2 font-medium text-foreground">
							· {selectedIds.size}개 선택됨
						</span>
					)}
				</p>
			</div>

			{categoryFilter !== 'all' && (
				<div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
					<FolderSync className="size-4 text-muted-foreground" />
					<span className="text-sm font-medium mr-1">
						카테고리 전체:
					</span>
					<Button variant="outline" size="sm" className="gap-1" onClick={() => handleCategoryVisibility('show_in_daily', true)}>
						<BookOpenCheck className="size-3.5" />
						오늘학습 ON
					</Button>
					<Button variant="outline" size="sm" className="gap-1" onClick={() => handleCategoryVisibility('show_in_daily', false)}>
						<EyeOff className="size-3.5" />
						오늘학습 OFF
					</Button>
					<div className="h-4 w-px bg-border" />
					<Button variant="outline" size="sm" className="gap-1" onClick={() => handleCategoryVisibility('show_in_flashcard', true)}>
						<Eye className="size-3.5" />
						플래시카드 ON
					</Button>
					<Button variant="outline" size="sm" className="gap-1" onClick={() => handleCategoryVisibility('show_in_flashcard', false)}>
						<EyeOff className="size-3.5" />
						플래시카드 OFF
					</Button>
				</div>
			)}

			{hasSelection && (
				<div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
					<span className="text-sm font-medium mr-2">
						일괄 작업:
					</span>
					<Button
						variant="destructive"
						size="sm"
						onClick={handleBulkDelete}
						className="gap-1"
					>
						<Trash2 className="size-3.5" />
						삭제 ({selectedIds.size})
					</Button>
					<div className="h-4 w-px bg-border" />
					<span className="text-xs text-muted-foreground">
						오늘학습 {dailyOnCount}/{selectedIds.size} ON
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleBulkVisibility('show_in_daily', true)}
						className="gap-1"
					>
						<BookOpenCheck className="size-3.5" />
						오늘학습 ON
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleBulkVisibility('show_in_daily', false)}
						className="gap-1"
					>
						<EyeOff className="size-3.5" />
						오늘학습 OFF
					</Button>
					<div className="h-4 w-px bg-border" />
					<span className="text-xs text-muted-foreground">
						플래시카드 {flashcardOnCount}/{selectedIds.size} ON
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleBulkVisibility('show_in_flashcard', true)}
						className="gap-1"
					>
						<Eye className="size-3.5" />
						플래시카드 ON
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleBulkVisibility('show_in_flashcard', false)}
						className="gap-1"
					>
						<EyeOff className="size-3.5" />
						플래시카드 OFF
					</Button>
				</div>
			)}

			<QuestionTable
				questions={questions}
				categoryMap={categoryMap}
				loading={loading}
				selectedIds={selectedIds}
				onSelectionChange={setSelectedIds}
				onDelete={handleDelete}
			/>

			<Pagination
				page={page}
				totalPages={totalPages}
				onPageChange={setPage}
			/>
		</div>
	);
}
