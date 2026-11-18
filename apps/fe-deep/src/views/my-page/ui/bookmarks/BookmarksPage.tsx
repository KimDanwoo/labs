'use client';

import { Bookmark } from 'lucide-react';

import { Accordion } from '@shared/ui/Accordion';

import { useBookmarkedQuestions } from '../../model/hooks/useBookmarkedQuestions';
import { BookmarkItem } from './BookmarkItem';
import { styles } from './BookmarksPage.styles';
import { EmptyBookmarks } from './EmptyBookmarks';

export function BookmarksPage() {
  const { bookmarkedQuestions, handleRemoveBookmark, getCategoryForQuestion } = useBookmarkedQuestions();

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <div className={styles.headingIcon}>
          <Bookmark className={styles.headingGlyph} />
        </div>
        <h1 className={styles.title}>북마크</h1>
      </div>
      <p className={styles.description}>북마크한 질문을 모아서 학습하세요. ({bookmarkedQuestions.length}개)</p>

      {bookmarkedQuestions.length > 0 ? (
        <Accordion type="multiple" className={styles.list}>
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
    </div>
  );
}
