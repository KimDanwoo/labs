import { Button } from '@shared/ui/Button';

import { FILTER_LABELS, FILTER_ORDER } from '../../config/filters';
import type { StudyFilter } from '../../model/services/studyFilter';
import { styles } from './StudyFilterBar.styles';

interface ProgressFilterProps {
  selected: StudyFilter;
  counts: Record<StudyFilter, number>;
  onChange: (filter: StudyFilter) => void;
}

export function ProgressFilter({ selected, counts, onChange }: ProgressFilterProps) {
  return (
    <div className={styles.progressGroup} role="group" aria-label="진행 상태 필터">
      <span className={styles.progressLabel}>진행</span>
      {FILTER_ORDER.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={value === selected ? 'secondary' : 'ghost'}
          aria-pressed={value === selected}
          onClick={() => onChange(value)}
          className={styles.progressOption}
        >
          {FILTER_LABELS[value]}
          <span className={styles.count}>{counts[value]}</span>
        </Button>
      ))}
    </div>
  );
}
