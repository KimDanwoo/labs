import { EmptyState } from '@shared/ui/EmptyState';

import { useSearchContext } from '../../model/hooks/useSearchContext';

export function SearchNoResults() {
  const { isEmptyResult } = useSearchContext();
  if (!isEmptyResult) return null;

  return <EmptyState message="검색 결과가 없습니다. 다른 키워드로 검색해보세요." />;
}
