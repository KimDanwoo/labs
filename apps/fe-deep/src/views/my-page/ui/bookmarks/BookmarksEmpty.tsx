import { Bookmark } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@shared/ui/Button';
import { EmptyState } from '@shared/ui/EmptyState';

import { useBookmarksContext } from '../../model/hooks/useBookmarksContext';

export function BookmarksEmpty() {
  const { bookmarkedQuestions } = useBookmarksContext();
  if (bookmarkedQuestions.length > 0) return null;

  return (
    <EmptyState
      icon={<Bookmark className="h-8 w-8 text-muted-foreground/50" />}
      message="아직 북마크한 질문이 없습니다."
    >
      <Button variant="link" className="mt-3" asChild>
        <Link href="/reference">레퍼런스에서 질문 북마크하기 →</Link>
      </Button>
    </EmptyState>
  );
}
