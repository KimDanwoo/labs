'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/shared/config/supabase/client';
import type { Question, Category } from '@/entities/question/model';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { DifficultyBadge } from '@/entities/question/ui/difficulty-badge';
import { deleteQuestion } from '../actions';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

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

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="질문 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="난이도" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {totalCount}개 질문 (페이지 {page}/{totalPages})
      </p>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">카테고리</th>
              <th className="text-left p-3 font-medium">질문</th>
              <th className="text-left p-3 font-medium">소분류</th>
              <th className="text-left p-3 font-medium">난이도</th>
              <th className="text-left p-3 font-medium">태그</th>
              <th className="text-right p-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  불러오는 중...
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  결과가 없습니다.
                </td>
              </tr>
            ) : (
              questions.map((q) => {
                const cat = categoryMap.get(q.category_id);
                return (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap">
                      {cat ? `${cat.icon} ${cat.title}` : q.category_id}
                    </td>
                    <td className="p-3 max-w-md">
                      <span className="line-clamp-1">{q.question}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {q.sub_category}
                    </td>
                    <td className="p-3">
                      <DifficultyBadge difficulty={q.difficulty} />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {q.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {q.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{q.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/questions/${q.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(q.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - page) <= 2;
            })
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
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              )
            )}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
