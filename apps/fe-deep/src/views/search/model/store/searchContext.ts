'use client';

import type { SearchModel } from '@views/search/model/hooks/useSearch';
import { createContext } from 'react';

export const SearchContext = createContext<SearchModel | null>(null);
