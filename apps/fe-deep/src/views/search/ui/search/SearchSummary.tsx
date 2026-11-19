import { useSearchContext } from '../../model/hooks/useSearchContext';

export function SearchSummary() {
  const { debouncedQuery, isSearching, displayResults } = useSearchContext();
  if (!debouncedQuery) return null;

  return (
    <p className="text-sm text-muted-foreground mb-4">
      &quot;{debouncedQuery}&quot;에 대한 검색 결과 {isSearching ? '...' : `${displayResults.length}건`}
    </p>
  );
}
