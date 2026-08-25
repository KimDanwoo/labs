'use client';

import { cn } from '@shared/lib/utils';
import type { StudyTopic } from '../model';

/** 문서 제목에 이미 번호가 있으면(`1. 자기소개`) 목차에서 번호를 중복 표기하지 않는다. */
const LEADING_NUMBER_PATTERN = /^\d/;

interface TopicTocProps {
  topics: StudyTopic[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function TopicToc({ topics, activeIndex, onSelect }: TopicTocProps) {
  return (
    <nav className="p-2" aria-label="주제 목차">
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        주제 {topics.length}개
      </p>
      <ol className="space-y-0.5">
        {topics.map((topic, index) => (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={cn(
                'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                index === activeIndex
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {!LEADING_NUMBER_PATTERN.test(topic.title) && (
                <span className="shrink-0 pt-0.5 text-xs tabular-nums opacity-60">{index + 1}</span>
              )}
              <span className="break-keep">{topic.title}</span>
              <span className="ml-auto shrink-0 pt-0.5 text-xs tabular-nums opacity-50">{topic.steps.length}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
