'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import type { ReactNode } from 'react';

import { useBookmarkedQuestions } from '@views/my-page/model/hooks/useBookmarkedQuestions';
import { BookmarksContext } from '@views/my-page/model/store/bookmarksContext';

interface BookmarksRootProps {
  children: ReactNode;
}

export function BookmarksRoot({ children }: BookmarksRootProps) {
  const bookmarks = useBookmarkedQuestions();
  return (
    <BookmarksContext.Provider value={bookmarks}>
      <PageContainer width="medium" enter="fade">
        {children}
      </PageContainer>
    </BookmarksContext.Provider>
  );
}
