'use client';

import { searchQuestions, type SearchResult } from '@entities/question';
import { useDebounce } from '@shared/lib/useDebounce';
import { SEARCH_DEBOUNCE_MS } from '@views/search/config/debounce';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useSearch() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) return undefined;

    let cancelled = false;
    searchQuestions(debouncedQuery)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setLastSearchedQuery(debouncedQuery);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(new Error('검색 결과를 불러오지 못했습니다.', { cause }));
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const hasQuery = debouncedQuery.trim() !== '';
  const displayResults = hasQuery ? results : [];
  const isSearching = hasQuery && debouncedQuery !== lastSearchedQuery;

  if (error) throw error;

  return {
    query,
    setQuery,
    debouncedQuery,
    displayResults,
    isSearching,
    hasQuery,
    hasResults: displayResults.length > 0,
    isEmptyResult: debouncedQuery !== '' && !isSearching && displayResults.length === 0,
  };
}

export type SearchModel = ReturnType<typeof useSearch>;
