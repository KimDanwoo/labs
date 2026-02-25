'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { searchQuestions } from '@/entities/question';
import type { SearchResult } from '@/entities/question';
import { MarkdownRenderer } from '@/shared/ui/markdown-renderer';
import { DifficultyBadge } from '@/entities/question/ui/difficulty-badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';

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
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">검색</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="키워드로 질문, 답변, 태그를 검색하세요..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-base"
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
        <Accordion type="multiple" className="space-y-2">
          {displayResults.map((result) => (
            <AccordionItem
              key={result.question.id}
              value={result.question.id}
              className="border rounded-lg px-4"
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
                <div className="mt-3">
                  <Link
                    href={`/reference/${result.category.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {result.category.title}에서 더 보기 →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : debouncedQuery && !isSearching ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        </Card>
      ) : !debouncedQuery ? (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            키워드를 입력하면 모든 질문과 답변에서 검색합니다.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
