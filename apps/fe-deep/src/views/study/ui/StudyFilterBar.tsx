'use client';

import { Button } from '@shared/ui';
import { STUDY_FILTER, type StudyFilter } from '../model';

const FILTER_LABELS: Record<StudyFilter, string> = {
  [STUDY_FILTER.all]: '전체',
  [STUDY_FILTER.todo]: '이해 안 됨',
  [STUDY_FILTER.done]: '이해됨',
};

const FILTER_ORDER: StudyFilter[] = [STUDY_FILTER.all, STUDY_FILTER.todo, STUDY_FILTER.done];

interface StudyFilterBarProps {
  filter: StudyFilter;
  counts: Record<StudyFilter, number>;
  onChange: (filter: StudyFilter) => void;
}

export function StudyFilterBar({ filter, counts, onChange }: StudyFilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="이해됨 필터">
      {FILTER_ORDER.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={value === filter ? 'secondary' : 'ghost'}
          aria-pressed={value === filter}
          onClick={() => onChange(value)}
          className="gap-1.5"
        >
          {FILTER_LABELS[value]}
          <span className="text-xs tabular-nums opacity-60">{counts[value]}</span>
        </Button>
      ))}
    </div>
  );
}
