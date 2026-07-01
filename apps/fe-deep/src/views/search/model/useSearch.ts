'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@shared/lib/hooks';
import { searchQuestions } from '@entities/question';
import type { SearchResult } from '@entities/question';

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

	useEffect(() => {
		if (!debouncedQuery.trim()) return;

		let cancelled = false;
		searchQuestions(debouncedQuery).then((data) => {
			if (!cancelled) {
				setResults(data);
				setLastSearchedQuery(debouncedQuery);
			}
		});
		return () => { cancelled = true; };
	}, [debouncedQuery]);

	const displayResults = debouncedQuery.trim() ? results : [];
	const isSearching = debouncedQuery.trim() !== '' && debouncedQuery !== lastSearchedQuery;

	return { query, setQuery, debouncedQuery, displayResults, isSearching };
}
