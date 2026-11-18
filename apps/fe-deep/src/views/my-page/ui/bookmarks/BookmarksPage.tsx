'use client';

import { PageContainer } from '@shared/ui/PageContainer';
import { PageTitle } from '@shared/ui/PageTitle';
import { Bookmark } from 'lucide-react';

import { Accordion } from '@shared/ui/Accordion';

import { useBookmarkedQuestions } from '../../model/hooks/useBookmarkedQuestions';
import { BookmarkItem } from './BookmarkItem';
import { EmptyBookmarks } from './EmptyBookmarks';

export function BookmarksPage() {
  const { bookmarkedQuestions, handleRemoveBookmark, getCategoryForQuestion } = useBookmarkedQuestions();

  return (
    <PageContainer width="medium" enter="fade">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Bookmark className="h-5 w-5 text-primary" />
        </div>
        <PageTitle>북마크</PageTitle>
      </div>
      <p className="text-muted-foreground mb-8">북마크한 질문을 모아서 학습하세요. ({bookmarkedQuestions.length}개)</p>

      {bookmarkedQuestions.length > 0 ? (
        <Accordion type="multiple" className="space-y-2.5">
          {bookmarkedQuestions.map((question) => (
            <BookmarkItem
              key={question.id}
              question={question}
              category={getCategoryForQuestion(question.category_id)}
              onRemove={handleRemoveBookmark}
            />
          ))}
        </Accordion>
      ) : (
        <EmptyBookmarks />
      )}
    </PageContainer>
  );
}
