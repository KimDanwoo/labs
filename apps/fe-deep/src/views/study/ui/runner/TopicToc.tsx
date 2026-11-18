'use client';

import { BookmarkPlus, Check } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { hasLeadingNumber } from '../../lib/hasLeadingNumber';
import type { StudyTopic } from '../../lib/parseHandbook';
import { styles } from './TopicToc.styles';

interface TopicTocProps {
  topics: StudyTopic[];
  activeIndex: number;
  understood: Set<string>;
  review: Set<string>;
  onSelect: (index: number) => void;
}

export function TopicToc({ topics, activeIndex, understood, review, onSelect }: TopicTocProps) {
  return (
    <nav className="p-2" aria-label="주제 목차">
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        주제 {topics.length}개
      </p>
      <ol className="space-y-0.5">
        {topics.map((topic, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(styles.item.base, isActive ? styles.item.active : styles.item.inactive)}
              >
                {!hasLeadingNumber(topic.title) && (
                  <span className="shrink-0 pt-0.5 text-xs tabular-nums opacity-60">{index + 1}</span>
                )}
                <span className="break-keep">{topic.title}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1 pt-0.5">
                  {understood.has(topic.title) && <Check aria-label="이해됨" className="size-3.5 text-primary" />}
                  {review.has(topic.title) && <BookmarkPlus aria-label="오답노트" className="size-3.5 text-warning" />}
                  <span className="text-xs tabular-nums opacity-50">{topic.steps.length}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
