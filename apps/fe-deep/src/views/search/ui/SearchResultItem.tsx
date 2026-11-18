import Link from 'next/link';

import { DifficultyBadge, type SearchResult } from '@entities/question';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/Accordion';
import { Badge } from '@shared/ui/Badge';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { MATCH_TYPE_LABEL } from '../config/matchType';
import { styles } from './SearchContent.styles';

interface SearchResultItemProps {
  result: SearchResult;
}

export function SearchResultItem({ result: { question, category, matchType } }: SearchResultItemProps) {
  return (
    <AccordionItem value={question.id} className={styles.item}>
      <AccordionTrigger className={styles.trigger}>
        <div className={styles.itemSummary}>
          <span className={styles.question}>{question.question}</span>
          <div className={styles.meta}>
            <Badge variant="outline" className={styles.badge}>
              {category.icon} {category.title}
            </Badge>
            <DifficultyBadge difficulty={question.difficulty} />
            <Badge variant="secondary" className={styles.badge}>
              {MATCH_TYPE_LABEL[matchType]}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={styles.content}>
        <MarkdownRenderer content={question.answer} />
        <div className={styles.more}>
          <Link href={`/reference/${category.slug}`} className={styles.moreLink}>
            {category.title}에서 더 보기 →
          </Link>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
