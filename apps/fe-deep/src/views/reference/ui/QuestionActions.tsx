'use client';

import { Button } from '@ui/react';
import { Bookmark, BookmarkCheck, CheckCircle } from 'lucide-react';
import { useQuestionActions } from '../model/hooks/useQuestionActions';

interface QuestionActionsProps {
  questionId: string;
}

export function QuestionActions({ questionId }: QuestionActionsProps) {
  const { isBookmarked, isMastered, handleBookmarkToggle, handleMarkLearned } = useQuestionActions(questionId);

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
      <Button variant="ghost" size="sm" onClick={handleBookmarkToggle} className="gap-2 transition-colors duration-200">
        {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-highlight" /> : <Bookmark className="h-4 w-4" />}
        {isBookmarked ? '북마크됨' : '북마크'}
      </Button>
      {!isMastered && (
        <Button variant="ghost" size="sm" onClick={handleMarkLearned} className="gap-2 transition-colors duration-200">
          <CheckCircle className="h-4 w-4" />
          학습 완료
        </Button>
      )}
    </div>
  );
}
