import { PageTitle } from '@shared/ui/PageTitle';
import { Bookmark } from 'lucide-react';

import { useBookmarksContext } from '@views/my-page/model/hooks/useBookmarksContext';

export function BookmarksIntro() {
  const { bookmarkedQuestions } = useBookmarksContext();

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Bookmark className="h-5 w-5 text-primary" />
        </div>
        <PageTitle>북마크</PageTitle>
      </div>
      <p className="text-muted-foreground mb-8">북마크한 질문을 모아서 학습하세요. ({bookmarkedQuestions.length}개)</p>
    </>
  );
}
