'use client';

import { createContext } from 'react';
import type { BookmarksModel } from '../hooks/useBookmarkedQuestions';

export const BookmarksContext = createContext<BookmarksModel | null>(null);
