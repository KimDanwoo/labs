import { Search } from 'lucide-react';

import { EmptyState } from '@shared/ui/EmptyState';

import { useSearchContext } from '../../model/hooks/useSearchContext';

export function SearchPrompt() {
  const { debouncedQuery } = useSearchContext();
  if (debouncedQuery) return null;

  return (
    <EmptyState
      icon={<Search className="h-7 w-7 text-muted-foreground/50" />}
      message="키워드를 입력하면 모든 질문과 답변에서 검색합니다."
    />
  );
}
