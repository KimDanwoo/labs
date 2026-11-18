import { Checkbox } from '@shared/ui/Checkbox';

import { TIER_LABELS } from '../../config/filters';
import { STUDY_TIER_ORDER, type StudyTier } from '../../model/services/studyFilter';
import { styles } from './StudyFilterBar.styles';

interface TierFilterProps {
  selected: Set<StudyTier>;
  counts: Record<StudyTier, number>;
  onToggle: (tier: StudyTier) => void;
}

export function TierFilter({ selected, counts, onToggle }: TierFilterProps) {
  return (
    <div className={styles.tierGroup} role="group" aria-label="티어 필터">
      <span className={styles.groupLabel}>티어</span>
      {STUDY_TIER_ORDER.map((tier) => (
        <label key={tier} className={styles.tierOption}>
          <Checkbox checked={selected.has(tier)} onCheckedChange={() => onToggle(tier)} />
          {TIER_LABELS[tier]}
          <span className={styles.count}>{counts[tier]}</span>
        </label>
      ))}
    </div>
  );
}
