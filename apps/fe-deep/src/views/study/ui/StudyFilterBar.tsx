'use client';

import { Button, Checkbox } from '@shared/ui';
import { STUDY_FILTER, STUDY_TIER, STUDY_TIER_ORDER, type StudyFilter, type StudyTier } from '../model';

const FILTER_LABELS: Record<StudyFilter, string> = {
  [STUDY_FILTER.all]: '전체',
  [STUDY_FILTER.todo]: '이해 안 됨',
  [STUDY_FILTER.done]: '이해됨',
  [STUDY_FILTER.review]: '오답노트',
};

const FILTER_ORDER: StudyFilter[] = [STUDY_FILTER.all, STUDY_FILTER.todo, STUDY_FILTER.done, STUDY_FILTER.review];

const TIER_LABELS: Record<StudyTier, string> = {
  [STUDY_TIER.a]: 'A',
  [STUDY_TIER.b]: 'B',
  [STUDY_TIER.c]: 'C',
};

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
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="티어 필터">
        <span className="text-xs text-muted-foreground">티어</span>
        {STUDY_TIER_ORDER.map((tier) => (
          <label key={tier} className="flex cursor-pointer items-center gap-1.5 text-sm">
            <Checkbox checked={tiers.has(tier)} onCheckedChange={() => onToggleTier(tier)} />
            {TIER_LABELS[tier]}
            <span className="text-xs tabular-nums opacity-60">{tierCounts[tier]}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="진행 상태 필터">
        <span className="mr-1.5 text-xs text-muted-foreground">진행</span>
        {FILTER_ORDER.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={value === filter ? 'secondary' : 'ghost'}
            aria-pressed={value === filter}
            onClick={() => onChangeFilter(value)}
            className="gap-1.5"
          >
            {FILTER_LABELS[value]}
            <span className="text-xs tabular-nums opacity-60">{counts[value]}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
