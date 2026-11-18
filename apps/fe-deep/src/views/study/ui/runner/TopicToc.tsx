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
    <nav className={styles.nav} aria-label="주제 목차">
      <p className={styles.heading}>주제 {topics.length}개</p>
      <ol className={styles.list}>
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
                {!hasLeadingNumber(topic.title) && <span className={styles.number}>{index + 1}</span>}
                <span className={styles.title}>{topic.title}</span>
                <span className={styles.marks}>
                  {understood.has(topic.title) && <Check aria-label="이해됨" className={styles.understood} />}
                  {review.has(topic.title) && <BookmarkPlus aria-label="오답노트" className={styles.review} />}
                  <span className={styles.stepCount}>{topic.steps.length}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
