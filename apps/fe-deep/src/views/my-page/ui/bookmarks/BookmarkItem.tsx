import { Trash2 } from 'lucide-react';
import Link from 'next/link';

import { DifficultyBadge, type Category, type Question } from '@entities/question';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/Accordion';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { styles } from './BookmarksPage.styles';

interface BookmarkItemProps {
  question: Question;
  category: Category | undefined;
  onRemove: (questionId: string) => void;
}

export function BookmarkItem({ question, category, onRemove }: BookmarkItemProps) {
  return (
    <AccordionItem value={question.id} className={styles.item}>
      <AccordionTrigger className={styles.trigger}>
        <div className={styles.summary}>
          <span className={styles.question}>{question.question}</span>
          <div className={styles.meta}>
            {category && (
              <Badge variant="outline" className={styles.categoryBadge}>
                {category.icon} {category.title}
              </Badge>
            )}
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={styles.content}>
        <MarkdownRenderer content={question.answer} />
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => onRemove(question.id)} className={styles.remove}>
            <Trash2 className={styles.removeIcon} />
            북마크 삭제
          </Button>
          {category && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/reference/${category.slug}`}>{category.title}에서 보기 →</Link>
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
