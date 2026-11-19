import { PageTitle } from '@shared/ui/PageTitle';
import { Search } from 'lucide-react';

import { Input } from '@shared/ui/Input';

import { useSearchContext } from '../../model/hooks/useSearchContext';

export function SearchField() {
  const { query, setQuery } = useSearchContext();

  return (
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
  );
}
