import Link from 'next/link';

import { categoryHref, DifficultyBadge, type SearchResult } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { CardAccordionItem } from '@shared/ui/CardAccordionItem';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { MATCH_TYPE_LABEL } from '@views/search/config/matchType';

interface SearchResultItemProps {
  result: SearchResult;
}

export function SearchResultItem({ result: { question, category, matchType } }: SearchResultItemProps) {
  return (
    <CardAccordionItem
      value={question.id}
      trigger={
        <div className="flex flex-col gap-1.5 text-left flex-1 mr-4">
          <span className="font-normal text-sm leading-relaxed">{question.question}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {category.icon} {category.title}
            </Badge>
            <DifficultyBadge difficulty={question.difficulty} />
            <Badge variant="secondary" className="text-xs">
              {MATCH_TYPE_LABEL[matchType]}
            </Badge>
          </div>
        </div>
      }
    >
      <MarkdownRenderer content={question.answer} />
      <div className="mt-4 pt-3 border-t border-border/50">
        <Link
          href={categoryHref(category.slug)}
          className="text-sm text-primary hover:underline transition-colors duration-200"
        >
          {category.title}에서 더 보기 →
        </Link>
      </div>
    </CardAccordionItem>
  );
}
