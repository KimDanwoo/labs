import { TEN_GOD_FRIENDLY } from '@views/destiny-result/constants';

import { getTenGod } from '@entities/destiny/lib';
import type { LuckAnalysis } from '@entities/destiny/lib';
import type { HeavenlyStem } from '@entities/destiny/model';

import { cn } from '@shared/lib/cn';

import { pillarToKr } from '../utils';

import { CharacterBubble } from './CharacterBubble';
import { DataSection } from './DataSection';
import { SectionTitle } from './SectionTitle';

type LuckSectionProps = {
  luck: LuckAnalysis;
  dayStem: HeavenlyStem;
  birthYear: number;
  currentYear?: number;
};

export function LuckSection({
  luck,
  dayStem,
  birthYear,
  currentYear = new Date().getFullYear(),
}: LuckSectionProps) {
  const currentAge = currentYear - birthYear;

  const isCurrentPeriod = (startAge: number, endAge: number) =>
    currentAge >= startAge && currentAge <= endAge;

  return (
    <>
      <CharacterBubble
        imageSrc="/bubble_3.png"
        text={`앞으로의 대운 흐름을\n읽어드릴게요.`}
      />
      <DataSection>
        <SectionTitle title="10년 단위 운의 흐름" sub="대운 — 인생의 큰 물결" />
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="text-xs text-muted">대운 시작</span>
          <span className="text-sm font-black text-gold">
            {luck.startAge}세
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs font-semibold text-foreground">
            {luck.direction === 'forward' ? '순행 ▶' : '역행 ◀'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {luck.majorLuck.slice(0, 8).map((period, i) => {
            const tenGod = getTenGod(dayStem, period.pillar.stem);
            const isCurrent = isCurrentPeriod(period.startAge, period.endAge);

            return (
              <div
                key={period.startAge}
                className={cn(
                  'rounded-xl p-3 text-center transition-all',
                  isCurrent
                    ? 'bg-gold/10 ring-1 ring-gold/40'
                    : 'bg-white shadow-sm',
                )}
              >
                <span
                  className={cn(
                    'block text-[11px] font-semibold',
                    isCurrent ? 'text-gold' : 'text-muted',
                  )}
                >
                  {i + 1}대운
                </span>
                <span
                  className={cn(
                    'block text-lg font-black mt-1',
                    isCurrent ? 'text-gold' : 'text-foreground',
                  )}
                >
                  {pillarToKr(period.pillar)}
                </span>
                <span className="block text-xs text-[#555] mt-0.5">
                  {period.pillar.stem}
                  {period.pillar.branch}
                </span>
                <span
                  className={cn(
                    'block text-xs font-semibold mt-1.5',
                    isCurrent ? 'text-gold' : 'text-[#333]',
                  )}
                  title={TEN_GOD_FRIENDLY[tenGod]?.split('\n')[0] ?? ''}
                >
                  {tenGod}
                </span>
                <span
                  className={cn(
                    'block text-[11px] font-medium mt-1',
                    isCurrent ? 'text-gold font-bold' : 'text-[#555]',
                  )}
                >
                  {period.startAge}~{period.endAge}세
                </span>
              </div>
            );
          })}
        </div>
      </DataSection>
    </>
  );
}
