'use client';

import { DIFFICULTY_CONFIG, DIFFICULTY_VALUES, type Difficulty, type Question } from '@entities/question';
import { Button } from '@shared/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QuestionAccordion } from './QuestionAccordion';

export const QUESTIONS_PER_PAGE = 10;
const NEARBY_PAGES = 2;

type PageItem = number | 'ellipsis';

interface CategoryQuestionListProps {
  categorySlug: string;
  questions: Question[];
}

const DIFFICULTY_FILTERS: { value: Difficulty | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  ...DIFFICULTY_VALUES.map((value) => ({ value, label: DIFFICULTY_CONFIG[value].label })),
];

function toDifficulty(value: string | null): Difficulty | undefined {
  return DIFFICULTY_VALUES.find((candidate) => candidate === value);
}

function buildHref(categorySlug: string, page: number, difficulty?: Difficulty): string {
  const query = new URLSearchParams();
  if (page > 1) query.set('page', String(page));
  if (difficulty) query.set('difficulty', difficulty);
  const qs = query.toString();
  return `/reference/${categorySlug}${qs ? `?${qs}` : ''}`;
}

function buildPageItems(totalPages: number, page: number): PageItem[] {
  const visible = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= NEARBY_PAGES,
  );
  return visible.flatMap((p, idx): PageItem[] => {
    const previous = visible[idx - 1];
    return previous !== undefined && p - previous > 1 ? ['ellipsis', p] : [p];
  });
}

export function CategoryQuestionList({ categorySlug, questions }: CategoryQuestionListProps) {
  const searchParams = useSearchParams();
  const difficulty = toDifficulty(searchParams.get('difficulty'));
  const filtered = difficulty ? questions.filter((question) => question.difficulty === difficulty) : questions;
  const totalPages = Math.max(1, Math.ceil(filtered.length / QUESTIONS_PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams.get('page')) || 1));
  const startIndex = (page - 1) * QUESTIONS_PER_PAGE;
  const pageQuestions = filtered.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="난이도 필터">
        {DIFFICULTY_FILTERS.map(({ value, label }) => (
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

      {pageQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">이 난이도의 질문이 없습니다.</p>
      ) : (
        <QuestionAccordion questions={pageQuestions} startIndex={startIndex} />
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-10" aria-label="페이지네이션">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild className="shadow-sm">
              <Link href={buildHref(categorySlug, page - 1, difficulty)} aria-label="이전 페이지">
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled aria-label="이전 페이지">
              <ChevronLeft className="size-4" />
            </Button>
          )}

          {buildPageItems(totalPages, page).map((item, idx) =>
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

          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild className="shadow-sm">
              <Link href={buildHref(categorySlug, page + 1, difficulty)} aria-label="다음 페이지">
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled aria-label="다음 페이지">
              <ChevronRight className="size-4" />
            </Button>
          )}
        </nav>
      )}
    </>
  );
}
