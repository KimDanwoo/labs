import { Accordion } from '@shared/ui/Accordion';

import { useBookmarksContext } from '@views/my-page/model/hooks/useBookmarksContext';
import { BookmarkItem } from '@views/my-page/ui/bookmarks/BookmarkItem';

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
