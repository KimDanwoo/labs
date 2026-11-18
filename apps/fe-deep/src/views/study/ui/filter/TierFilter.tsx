import { Checkbox } from '@shared/ui/Checkbox';

import { TIER_LABELS } from '../../config/filters';
import { STUDY_TIER_ORDER, type StudyTier } from '../../model/services/studyFilter';

interface TierFilterProps {
  selected: Set<StudyTier>;
  counts: Record<StudyTier, number>;
  onToggle: (tier: StudyTier) => void;
}

export function TierFilter({ selected, counts, onToggle }: TierFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="티어 필터">
      <span className="text-xs text-muted-foreground">티어</span>
      {STUDY_TIER_ORDER.map((tier) => (
        <label key={tier} className="flex cursor-pointer items-center gap-1.5 text-sm">
          <Checkbox checked={selected.has(tier)} onCheckedChange={() => onToggle(tier)} />
          {TIER_LABELS[tier]}
          <span className="text-xs tabular-nums opacity-60">{counts[tier]}</span>
        </label>
      ))}
    </div>
  );
}
