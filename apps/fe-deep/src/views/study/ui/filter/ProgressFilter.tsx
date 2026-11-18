import { Button } from '@shared/ui/Button';

import { FILTER_LABELS, FILTER_ORDER } from '../../config/filters';
import type { StudyFilter } from '../../model/services/studyFilter';

interface ProgressFilterProps {
  selected: StudyFilter;
  counts: Record<StudyFilter, number>;
  onChange: (filter: StudyFilter) => void;
}

export function ProgressFilter({ selected, counts, onChange }: ProgressFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="진행 상태 필터">
      <span className="mr-1.5 text-xs text-muted-foreground">진행</span>
      {FILTER_ORDER.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={value === selected ? 'secondary' : 'ghost'}
          aria-pressed={value === selected}
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
