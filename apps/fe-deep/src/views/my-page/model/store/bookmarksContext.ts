'use client';

import type { BookmarksModel } from '@views/my-page/model/hooks/useBookmarkedQuestions';
import { createContext } from 'react';

export const BookmarksContext = createContext<BookmarksModel | null>(null);
