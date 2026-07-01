import {
  DAY_MASTER_STORY,
  ELEMENT_EMOJI,
  STEM_ELEMENT,
  STEM_KR,
  TWELVE_STAGE_FRIENDLY,
} from '@views/destiny-result/constants';
import {
  BODY_STRENGTH_LABEL,
  getBodyStrengthDetail,
} from '@views/destiny-result/lib';

import type {
  BodyStrength,
  FormatAnalysis,
  TwelveStageAnalysis,
} from '@entities/destiny/lib';
import type { HeavenlyStem } from '@entities/destiny/model';

import { DataSection } from './DataSection';
import { SectionTitle } from './SectionTitle';

type PersonalitySectionProps = {
  dayStem: HeavenlyStem;
  bodyStrength: BodyStrength;
  twelveStages: TwelveStageAnalysis;
  format: FormatAnalysis;
};

const TWELVE_STAGE_LABELS = [
  { label: '초년운 (년주)', key: 'yearBranch' },
  { label: '청년운 (월주)', key: 'monthBranch' },
  { label: '중년운 (일주)', key: 'dayBranch' },
  { label: '말년운 (시주)', key: 'hourBranch' },
] as const;

export function PersonalitySection({
  dayStem,
  bodyStrength,
  twelveStages,
  format,
}: PersonalitySectionProps) {
  const dayEl = STEM_ELEMENT[dayStem];

  return (
    <DataSection>
      <SectionTitle
        title={`${ELEMENT_EMOJI[dayEl]} ${STEM_KR[dayStem]}(${dayStem})의 기운`}
        sub="일간 — 나의 본질적인 성격"
      />
      <div className="bg-card-bg border border-card-border rounded-2xl p-5 mb-3">
        <p className="text-xs text-primary font-bold mb-1">{format.name}</p>
        <p className="text-sm text-foreground/80 leading-[1.8]">
          {format.desc}
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-3">
        <p className="text-sm text-[#1a1a2e] leading-[1.8]">
          {DAY_MASTER_STORY[dayStem]}
        </p>
      </div>
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-5">
        <p className="text-xs text-primary font-semibold mb-2">
          {BODY_STRENGTH_LABEL[bodyStrength]}
        </p>
        <p className="text-sm text-[#1a1a2e] leading-[1.8]">
          {getBodyStrengthDetail(dayStem, bodyStrength)}
        </p>
      </div>

      <SectionTitle
        title="인생의 에너지 흐름"
        sub="12운성 — 각 시기의 에너지 상태"
      />
      <div className="flex flex-col gap-2">
        {TWELVE_STAGE_LABELS.map(({ label, key }) => {
          const stage = twelveStages[key];
          return (
            <div
              key={label}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8a8a9a]">{label}</span>
                <span className="text-base font-bold text-[#1a1a2e]">
                  {stage}
                </span>
              </div>
              <p className="text-xs text-[#6b6b7b] mt-1">
                {TWELVE_STAGE_FRIENDLY[
                  stage as keyof typeof TWELVE_STAGE_FRIENDLY
                ] ?? ''}
              </p>
            </div>
          );
        })}
      </div>
    </DataSection>
  );
}
