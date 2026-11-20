'use client';

import type { BookmarksModel } from '@views/my-page/model/hooks/useBookmarkedQuestions';
import { BookmarksContext } from '@views/my-page/model/store/bookmarksContext';
import { useContext } from 'react';

export function useBookmarksContext(): BookmarksModel {
  const value = useContext(BookmarksContext);
  if (!value) throw new Error('Bookmarks.Root 안에서만 사용할 수 있습니다');
  return value;
}
