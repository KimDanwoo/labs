'use client';

import type { SearchModel } from '@views/search/model/hooks/useSearch';
import { SearchContext } from '@views/search/model/store/searchContext';
import { useContext } from 'react';

export function useSearchContext(): SearchModel {
  const search = useContext(SearchContext);
  if (!search) throw new Error('Search.Root 안에서만 사용할 수 있습니다');
  return search;
}
