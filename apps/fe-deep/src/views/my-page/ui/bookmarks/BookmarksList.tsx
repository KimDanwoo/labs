import { Accordion } from '@shared/ui/Accordion';

import { useBookmarksContext } from '../../model/hooks/useBookmarksContext';
import { BookmarkItem } from './BookmarkItem';

export function BookmarksList() {
  const { bookmarkedQuestions } = useBookmarksContext();
  if (bookmarkedQuestions.length === 0) return null;

  return (
    <Accordion type="multiple" className="space-y-2.5">
      {bookmarkedQuestions.map((question) => (
        <BookmarkItem key={question.id} question={question} />
      ))}
    </Accordion>
  );
}
