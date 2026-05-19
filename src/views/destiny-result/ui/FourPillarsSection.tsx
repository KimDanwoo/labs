'use client';

import type { FourPillars, FiveElement } from '@entities/destiny/model';

import { PillarCard } from './PillarCard';

type StemElementMap = Record<string, FiveElement>;
type BranchElementMap = Record<string, FiveElement>;

const STEM_ELEMENTS: StemElementMap = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const BRANCH_ELEMENTS: BranchElementMap = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

type FourPillarsSectionProps = {
  fourPillars: FourPillars;
};

const PILLAR_LABELS = ['년주', '월주', '일주', '시주'] as const;

export function FourPillarsSection({ fourPillars }: FourPillarsSectionProps) {
  const pillars = [
    { key: 'year', label: PILLAR_LABELS[0], pillar: fourPillars.year },
    { key: 'month', label: PILLAR_LABELS[1], pillar: fourPillars.month },
    { key: 'day', label: PILLAR_LABELS[2], pillar: fourPillars.day },
    { key: 'hour', label: PILLAR_LABELS[3], pillar: fourPillars.hour },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-muted tracking-widest uppercase">
        사주
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {pillars.map(({ key, label, pillar }) => (
          <PillarCard
            key={key}
            label={label}
            stem={pillar.stem}
            branch={pillar.branch}
            stemElement={STEM_ELEMENTS[pillar.stem] ?? '木'}
            branchElement={BRANCH_ELEMENTS[pillar.branch] ?? '木'}
          />
        ))}
      </div>
    </div>
  );
}
