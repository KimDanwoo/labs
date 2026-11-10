'use client';

import {
  deleteQuestion,
  deleteQuestions,
  getAllCategories,
  updateCategoryVisibility,
  updateQuestionsVisibility,
  type QuestionVisibilityField,
} from '@entities/question';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@ui/react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { fetchQuestionList } from '../api/questionList';
import { FILTER_ALL, PAGE_SIZE, VISIBILITY_FIELD, VISIBILITY_LABEL } from '../config/questionList';
import { useQuestionListParams } from '../model/hooks/useQuestionListParams';
import { BulkActionBar } from './BulkActionBar';
import { CategoryVisibilityBar } from './CategoryVisibilityBar';
import { Pagination } from './Pagination';
import { QuestionFilters } from './QuestionFilters';
import { QuestionTable } from './QuestionTable';

const NO_SELECTION: ReadonlySet<string> = new Set();

export function QuestionsListPage() {
  const params = useQuestionListParams();
  const { page, category, difficulty, search } = params;
  const [selectedIds, setSelectedIds] = useState(NO_SELECTION);
  const clearSelection = () => setSelectedIds(NO_SELECTION);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => getAllCategories(),
  });

  const { data: list, refetch } = useQuery({
    queryKey: ['admin-questions', page, category, difficulty, search],
    queryFn: ({ signal }) => fetchQuestionList({ page, categoryId: category, difficulty, search }, signal),
  });

  const questions = list?.questions ?? [];
  const totalCount = list?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const categoryMap = new Map(categories.map((item) => [item.id, item]));

  const selectedQuestions = questions.filter((question) => selectedIds.has(question.id));
  const countVisible = (field: QuestionVisibilityField) =>
    selectedQuestions.filter((question) => question[field]).length;
  const hasSelection = selectedIds.size > 0;

  /** 변경을 실행하고 목록을 다시 불러온다. 실패는 서버가 준 사유를 그대로 알린다. */
  async function mutate(run: () => Promise<unknown>, failureMessage: string, onSuccess = clearSelection) {
    try {
      await run();
      onSuccess();
      refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : failureMessage);
    }
  }

  function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    mutate(
      () => deleteQuestion(id),
      '삭제 실패',
      () => setSelectedIds((previous) => new Set([...previous].filter((selectedId) => selectedId !== id))),
    );
  }

  function handleBulkDelete() {
    if (!hasSelection) return;
    if (!confirm(`선택한 ${selectedIds.size}개 질문을 삭제하시겠습니까?`)) return;
    mutate(() => deleteQuestions([...selectedIds]), '일괄 삭제 실패');
  }

  function handleBulkVisibility(field: QuestionVisibilityField, isVisible: boolean) {
    if (!hasSelection) return;
    mutate(() => updateQuestionsVisibility([...selectedIds], { [field]: isVisible }), '노출 설정 변경 실패');
  }

  function handleCategoryVisibility(field: QuestionVisibilityField, isVisible: boolean) {
    if (category === FILTER_ALL) {
      alert('카테고리를 먼저 선택해 주세요.');
      return;
    }
    const title = categoryMap.get(category)?.title ?? category;
    const action = isVisible ? 'ON' : 'OFF';
    if (!confirm(`"${title}" 카테고리 전체 질문을 ${VISIBILITY_LABEL[field]} ${action}하시겠습니까?`)) return;
    mutate(() => updateCategoryVisibility(category, { [field]: isVisible }), '카테고리 노출 설정 변경 실패');
  }

  function handleSearchChange(value: string) {
    params.setSearchInput(value);
    clearSelection();
  }

  function handleCategoryChange(value: string) {
    params.setCategory(value);
    clearSelection();
  }

  function handleDifficultyChange(value: string) {
    params.setDifficulty(value);
    clearSelection();
  }

  function handlePageChange(nextPage: number) {
    params.setPage(nextPage);
    clearSelection();
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
        search={params.searchInput}
        onSearchChange={handleSearchChange}
        categoryFilter={category}
        onCategoryFilterChange={handleCategoryChange}
        difficultyFilter={difficulty}
        onDifficultyFilterChange={handleDifficultyChange}
        categories={categories}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount}개 질문 (페이지 {page}/{totalPages})
          {hasSelection && <span className="ml-2 font-normal text-foreground">· {selectedIds.size}개 선택됨</span>}
        </p>
      </div>

      {category !== FILTER_ALL && <CategoryVisibilityBar onChange={handleCategoryVisibility} />}

      {hasSelection && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          visibleCounts={{
            [VISIBILITY_FIELD.daily]: countVisible(VISIBILITY_FIELD.daily),
            [VISIBILITY_FIELD.flashcard]: countVisible(VISIBILITY_FIELD.flashcard),
          }}
          onDelete={handleBulkDelete}
          onVisibilityChange={handleBulkVisibility}
        />
      )}

      <QuestionTable
        questions={questions}
        categoryMap={categoryMap}
        loading={!list}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onDelete={handleDelete}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}
