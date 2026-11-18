'use client';

import { Bookmark, BookmarkCheck, CheckCircle } from 'lucide-react';

import { Button } from '@shared/ui/Button';

import { useQuestionActions } from '../model/hooks/useQuestionActions';
import { styles } from './QuestionActions.styles';

interface QuestionActionsProps {
  questionId: string;
}

export function QuestionActions({ questionId }: QuestionActionsProps) {
  const { isBookmarked, isMastered, handleBookmarkToggle, handleMarkLearned } = useQuestionActions(questionId);

  return (
    <div className={styles.root}>
      <Button variant="ghost" size="sm" onClick={handleBookmarkToggle} className={styles.action}>
        {isBookmarked ? <BookmarkCheck className={styles.bookmarkedIcon} /> : <Bookmark className={styles.icon} />}
        {isBookmarked ? '북마크됨' : '북마크'}
      </Button>
      {!isMastered && (
        <Button variant="ghost" size="sm" onClick={handleMarkLearned} className={styles.action}>
          <CheckCircle className={styles.icon} />
          학습 완료
        </Button>
      )}
    </div>
  );
}
