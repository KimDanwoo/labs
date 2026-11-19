'use client';

import { useContext } from 'react';
import { SearchContext } from '../store/searchContext';
import type { SearchModel } from './useSearch';

export function useSearchContext(): SearchModel {
  const search = useContext(SearchContext);
  if (!search) throw new Error('Search.Root 안에서만 사용할 수 있습니다');
  return search;
}
