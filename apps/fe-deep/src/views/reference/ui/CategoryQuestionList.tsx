'use client';

import type { Question } from '@entities/question';

import { useCategoryPagination } from '../model/hooks/useCategoryPagination';
import { DifficultyFilterBar } from './DifficultyFilterBar';
import { Pagination } from './Pagination';
import { QuestionAccordion } from './QuestionAccordion';

interface CategoryQuestionListProps {
  categorySlug: string;
  questions: Question[];
}

export function CategoryQuestionList({ categorySlug, questions }: CategoryQuestionListProps) {
  const { difficulty, page, totalPages, startIndex, pageQuestions } = useCategoryPagination(questions);

  return (
    <>
      <DifficultyFilterBar categorySlug={categorySlug} selected={difficulty} />

      {pageQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">이 난이도의 질문이 없습니다.</p>
      ) : (
        <QuestionAccordion questions={pageQuestions} startIndex={startIndex} />
      )}

      {totalPages > 1 && (
        <Pagination categorySlug={categorySlug} page={page} totalPages={totalPages} difficulty={difficulty} />
      )}
    </>
  );
}
