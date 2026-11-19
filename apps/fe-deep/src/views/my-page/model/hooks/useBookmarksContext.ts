'use client';

import { useContext } from 'react';
import { BookmarksContext } from '../store/bookmarksContext';
import type { BookmarksModel } from './useBookmarkedQuestions';

export function useBookmarksContext(): BookmarksModel {
  const value = useContext(BookmarksContext);
  if (!value) throw new Error('Bookmarks.Root 안에서만 사용할 수 있습니다');
  return value;
}
