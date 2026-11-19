'use client';

import { createContext } from 'react';
import type { SearchModel } from '../hooks/useSearch';

export const SearchContext = createContext<SearchModel | null>(null);
