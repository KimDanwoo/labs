'use client';

import { searchQuestions, type SearchResult } from '@entities/question';
import { useDebounce } from '@shared/lib/useDebounce';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 검색 쿼리 상태, 디바운스, 결과 fetch, 로딩 파생 상태를 관리한다.
 * lastSearchedQuery로 isSearching을 파생하여 별도 loading 상태를 제거한다.
 */
export function useSearch() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, 300);
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

  const displayResults = debouncedQuery.trim() ? results : [];
  const isSearching = debouncedQuery.trim() !== '' && debouncedQuery !== lastSearchedQuery;

  if (error) throw error;

  return { query, setQuery, debouncedQuery, displayResults, isSearching };
}
