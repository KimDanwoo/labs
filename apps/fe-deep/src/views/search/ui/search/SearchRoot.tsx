'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import type { ReactNode } from 'react';

import { useSearch } from '../../model/hooks/useSearch';
import { SearchContext } from '../../model/store/searchContext';

interface SearchRootProps {
  children: ReactNode;
}

export function SearchRoot({ children }: SearchRootProps) {
  const search = useSearch();
  return (
    <SearchContext.Provider value={search}>
      <PageContainer width="medium" enter="fade">
        {children}
      </PageContainer>
    </SearchContext.Provider>
  );
}
