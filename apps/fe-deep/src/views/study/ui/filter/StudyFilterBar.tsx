'use client';

import type { StudyFilter, StudyTier } from '../../model/services/studyFilter';
import { ProgressFilter } from './ProgressFilter';
import { TierFilter } from './TierFilter';

interface StudyFilterBarProps {
  tiers: Set<StudyTier>;
  tierCounts: Record<StudyTier, number>;
  filter: StudyFilter;
  counts: Record<StudyFilter, number>;
  onToggleTier: (tier: StudyTier) => void;
  onChangeFilter: (filter: StudyFilter) => void;
}

export function StudyFilterBar({
  tiers,
  tierCounts,
  filter,
  counts,
  onToggleTier,
  onChangeFilter,
}: StudyFilterBarProps) {
  return (
    <div className="mb-4 space-y-2">
      <TierFilter selected={tiers} counts={tierCounts} onToggle={onToggleTier} />
      <ProgressFilter selected={filter} counts={counts} onChange={onChangeFilter} />
    </div>
  );
}
