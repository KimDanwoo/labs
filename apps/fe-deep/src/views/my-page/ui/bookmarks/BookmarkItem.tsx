import { Trash2 } from 'lucide-react';
import Link from 'next/link';

import { categoryHref, DifficultyBadge, type Question } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { CardAccordionItem } from '@shared/ui/CardAccordionItem';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { useBookmarksContext } from '../../model/hooks/useBookmarksContext';

interface BookmarkItemProps {
  question: Question;
}

export function BookmarkItem({ question }: BookmarkItemProps) {
  const { getCategoryForQuestion, handleRemoveBookmark } = useBookmarksContext();
  const category = getCategoryForQuestion(question.category_id);
  return (
    <CardAccordionItem
      value={question.id}
      trigger={
        <div className="flex flex-col gap-1.5 text-left flex-1 mr-4">
          <span className="font-normal text-sm leading-relaxed">{question.question}</span>
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.icon} {category.title}
              </Badge>
            )}
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
        </div>
      }
    >
      <MarkdownRenderer content={question.answer} />
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveBookmark(question.id)}
          className="gap-2 text-error"
        >
          <Trash2 className="h-4 w-4" />
          북마크 삭제
        </Button>
        {category && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={categoryHref(category.slug)}>{category.title}에서 보기 →</Link>
          </Button>
        )}
      </div>
    </CardAccordionItem>
  );
}
