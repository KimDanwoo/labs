'use client';

import type { Question } from '@entities/question';

import { useCategoryPagination } from '@views/reference/model/hooks/useCategoryPagination';
import { DifficultyFilterBar } from '@views/reference/ui/DifficultyFilterBar';
import { Pagination } from '@views/reference/ui/Pagination';
import { QuestionAccordion } from '@views/reference/ui/QuestionAccordion';

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
