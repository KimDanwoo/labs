'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import { searchQuestions } from '@/entities/question';
import type { SearchResult } from '@/entities/question';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { DifficultyBadge } from '@/entities/question/ui/DifficultyBadge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/ui/Accordion';

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  // 마지막으로 검색 완료된 쿼리를 추적하여 isSearching을 파생한다.
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  useEffect(() => {
    if (!debouncedQuery.trim()) return;

    let cancelled = false;

    searchQuestions(debouncedQuery).then((data) => {
      if (!cancelled) {
        setResults(data);
        setLastSearchedQuery(debouncedQuery);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const displayResults = debouncedQuery.trim() ? results : [];
  const isSearching = debouncedQuery.trim() !== '' && debouncedQuery !== lastSearchedQuery;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-5">검색</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="키워드로 질문, 답변, 태그를 검색하세요..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 text-base shadow-sm border-border/60 focus:shadow transition-shadow duration-200"
            autoFocus
          />
        </div>
      </div>

      {debouncedQuery && (
        <p className="text-sm text-muted-foreground mb-4">
          &quot;{debouncedQuery}&quot;에 대한 검색 결과{' '}
          {isSearching ? '...' : `${displayResults.length}건`}
        </p>
      )}

      {displayResults.length > 0 ? (
        <Accordion type="multiple" className="space-y-2.5">
          {displayResults.map((result) => (
            <AccordionItem
              key={result.question.id}
              value={result.question.id}
              className="border border-border/60 rounded-xl px-4 shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-col gap-1.5 text-left flex-1 mr-4">
                  <span className="font-medium text-sm leading-relaxed">
                    {result.question.question}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {result.category.icon} {result.category.title}
                    </Badge>
                    <DifficultyBadge difficulty={result.question.difficulty} />
                    <Badge variant="secondary" className="text-xs">
                      {result.matchType === 'question'
                        ? '질문 일치'
                        : result.matchType === 'answer'
                        ? '답변 일치'
                        : '태그 일치'}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <MarkdownRenderer content={result.question.answer} />
                <div className="mt-4 pt-3 border-t border-border/50">
                  <Link
                    href={`/reference/${result.category.slug}`}
                    className="text-sm text-primary hover:underline transition-colors duration-200"
                  >
                    {result.category.title}에서 더 보기 →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : debouncedQuery && !isSearching ? (
        <Card className="p-16 text-center shadow-sm">
          <p className="text-muted-foreground">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        </Card>
      ) : !debouncedQuery ? (
        <Card className="p-16 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">
            키워드를 입력하면 모든 질문과 답변에서 검색합니다.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
