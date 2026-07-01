import {
  BRANCH_KR,
  ELEMENT_COLOR,
  STEM_ELEMENT,
  STEM_KR,
} from '@views/destiny-result/constants';

import type { Pillar } from '@entities/destiny/model';

type PillarCardLightProps = {
  label: string;
  pillar: Pillar;
  isVoid?: boolean;
};

export function PillarCardLight({
  label,
  pillar,
  isVoid = false,
}: PillarCardLightProps) {
  const el = STEM_ELEMENT[pillar.stem];
  return (
    <div className="flex flex-col items-center bg-white rounded-2xl overflow-hidden shadow-sm">
      <div
        className="w-full py-1 text-center text-[9px] font-semibold text-white"
        style={{ backgroundColor: ELEMENT_COLOR[el] }}
      >
        {label}
      </div>
      <div className="flex flex-col items-center gap-0.5 py-3 px-1">
        <span
          className="text-[clamp(22px,5.5vw,30px)] font-black leading-none"
          style={{ color: ELEMENT_COLOR[el] }}
        >
          {pillar.stem}
        </span>
        <span className="text-[clamp(22px,5.5vw,30px)] font-black leading-none text-[#1a1a2e]">
          {pillar.branch}
        </span>
        <span className="text-[9px] text-[#8a8a9a] font-medium mt-1">
          {STEM_KR[pillar.stem]}
          {BRANCH_KR[pillar.branch]}
        </span>
        {isVoid && (
          <span className="text-[8px] bg-red/10 text-red px-1.5 py-0.5 rounded-full font-semibold mt-0.5">
            공망
          </span>
        )}
      </div>
    </div>
  );
}
