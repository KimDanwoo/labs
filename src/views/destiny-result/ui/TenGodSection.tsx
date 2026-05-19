import { TEN_GOD_FRIENDLY } from '@views/destiny-result/constants';
import {
  analyzeTenGodPattern,
  getCombinationNarrative,
} from '@views/destiny-result/lib';

import type {
  CombinationAnalysis,
  TenGodAnalysis,
} from '@entities/destiny/lib';
import type { TenGod } from '@entities/destiny/model';

import { DataSection } from './DataSection';
import { SectionTitle } from './SectionTitle';

type TenGodSectionProps = {
  tenGods: TenGodAnalysis;
  topGod: TenGod | null;
  combinations: CombinationAnalysis;
};

const PILLAR_LABELS = [
  { label: '년주', key: 'yearStem', desc: '조상/사회운' },
  { label: '월주', key: 'monthStem', desc: '부모/직장운' },
  { label: '일주', key: 'dayStem', desc: '나 자신' },
  { label: '시주', key: 'hourStem', desc: '자녀/말년운' },
] as const;

export function TenGodSection({
  tenGods,
  topGod,
  combinations,
}: TenGodSectionProps) {
  const allGods: TenGod[] = [
    tenGods.yearStem,
    tenGods.yearBranch,
    tenGods.monthStem,
    tenGods.monthBranch,
    tenGods.dayBranch,
    tenGods.hourStem,
    tenGods.hourBranch,
  ];

  const pattern = analyzeTenGodPattern(allGods);
  const combinationNarrative = getCombinationNarrative(combinations);

  return (
    <DataSection>
      <SectionTitle
        title="나의 성향 분석"
        sub="십신 — 사주 속 나의 기질과 관계"
      />

      <div className="bg-gold/10 border border-gold/20 rounded-2xl p-5 mb-3">
        <p className="text-xs text-gold font-semibold mb-2">{pattern.title}</p>
        <p className="text-sm text-[#1a1a2e] leading-[1.8]">{pattern.desc}</p>
      </div>

      {topGod && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-3">
          <p className="text-sm text-[#1a1a2e] font-semibold">
            가장 강한 기운: <span className="text-gold">{topGod}</span>
          </p>
          <p className="text-xs text-[#6b6b7b] mt-1 leading-[1.7]">
            {TEN_GOD_FRIENDLY[topGod]}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-3">
        {PILLAR_LABELS.map(({ label, key, desc }) => {
          const god = tenGods[key];
          return (
            <div
              key={label}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#8a8a9a]">{label}</span>
                  <span className="text-[9px] text-[#b0b0b8] ml-1">
                    ({desc})
                  </span>
                </div>
                <span className="text-base font-bold text-[#1a1a2e]">
                  {god}
                </span>
              </div>
              <p className="text-xs text-[#6b6b7b] mt-1 leading-[1.7]">
                {TEN_GOD_FRIENDLY[god]}
              </p>
            </div>
          );
        })}
      </div>

      {combinationNarrative && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-[#8a8a9a] font-semibold mb-1">
            합·충의 기운
          </p>
          <p className="text-sm text-[#1a1a2e] leading-[1.8]">
            {combinationNarrative}
          </p>
        </div>
      )}
    </DataSection>
  );
}
