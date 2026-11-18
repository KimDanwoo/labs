'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import { PageTitle } from '@shared/ui/PageTitle';
import { Search } from 'lucide-react';

import { Accordion } from '@shared/ui/Accordion';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';

import { useSearch } from '../model/hooks/useSearch';
import { EmptySearchPrompt } from './EmptySearchPrompt';
import { SearchResultItem } from './SearchResultItem';

export function SearchContent() {
  const { query, setQuery, debouncedQuery, displayResults, isSearching } = useSearch();

  const hasResults = displayResults.length > 0;
  const showNoResults = !!debouncedQuery && !isSearching && !hasResults;

  return (
    <PageContainer width="medium" enter="fade">
      <div className="mb-8">
        <PageTitle className="mb-5">검색</PageTitle>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="키워드로 질문, 답변, 태그를 검색하세요..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-11 h-12 text-base shadow-sm border-border/60 focus:shadow transition-shadow duration-200"
            autoFocus
          />
        </div>
      </div>

      {debouncedQuery && (
        <p className="text-sm text-muted-foreground mb-4">
          &quot;{debouncedQuery}&quot;에 대한 검색 결과 {isSearching ? '...' : `${displayResults.length}건`}
        </p>
      )}

      {hasResults && (
        <Accordion type="multiple" className="space-y-2.5">
          {displayResults.map((result) => (
            <SearchResultItem key={result.question.id} result={result} />
          ))}
        </Accordion>
      )}

      {showNoResults && <EmptyState message="검색 결과가 없습니다. 다른 키워드로 검색해보세요." />}

      {!debouncedQuery && <EmptySearchPrompt />}
    </PageContainer>
  );
}
