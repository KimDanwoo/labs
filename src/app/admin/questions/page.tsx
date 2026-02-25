'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/shared/config/supabase/client';
import type { Question, Category } from '@/entities/question/model';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import { Button } from '@/shared/ui/button';
import { deleteQuestion } from '@/entities/question/services';
import { Plus } from 'lucide-react';
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

	// 필터 변경 시 1페이지로 리셋
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, categoryFilter, difficultyFilter]);

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
					'id, category_id, question, answer, sub_category, difficulty, order_num, tags',
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
			fetchQuestions(undefined);
		} catch (e) {
			alert(e instanceof Error ? e.message : '삭제 실패');
		}
	}

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

			<p className="text-sm text-muted-foreground">
				{totalCount}개 질문 (페이지 {page}/{totalPages})
			</p>

			<QuestionTable
				questions={questions}
				categoryMap={categoryMap}
				loading={loading}
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
