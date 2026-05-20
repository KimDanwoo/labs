import { TEN_GOD_FRIENDLY } from '@views/destiny-result/constants';

import { getTenGod } from '@entities/destiny/lib';
import type { LuckAnalysis } from '@entities/destiny/lib';
import type { HeavenlyStem } from '@entities/destiny/model';

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

const TEN_GOD_SHORT: Record<string, string> = {
  비견: '비견',
  겁재: '겁재',
  식신: '식신',
  상관: '상관',
  편재: '편재',
  정재: '정재',
  편관: '편관',
  정관: '정관',
  편인: '편인',
  정인: '정인',
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
        <div className="bg-white rounded-xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="bg-[#f0ede8]">
                {luck.majorLuck.slice(0, 8).map((period, i) => {
                  const isCurrent = isCurrentPeriod(
                    period.startAge,
                    period.endAge,
                  );
                  return (
                    <td
                      key={i}
                      className={`py-1.5 text-center text-[10px] font-semibold border-r border-white last:border-r-0 ${
                        isCurrent ? 'text-gold' : 'text-muted'
                      }`}
                    >
                      {i + 1}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-[#faf9f7]">
                {luck.majorLuck.slice(0, 8).map((period) => {
                  const isCurrent = isCurrentPeriod(
                    period.startAge,
                    period.endAge,
                  );
                  return (
                    <td
                      key={period.startAge}
                      className={`py-1.5 text-center text-[10px] border-r border-white last:border-r-0 ${
                        isCurrent ? 'text-gold font-bold' : 'text-muted'
                      }`}
                    >
                      {period.startAge}~
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-white">
                {luck.majorLuck.slice(0, 8).map((period) => {
                  const isCurrent = isCurrentPeriod(
                    period.startAge,
                    period.endAge,
                  );
                  return (
                    <td
                      key={period.startAge}
                      className={`py-2 text-center border-r border-[#f0ede8] last:border-r-0 ${
                        isCurrent ? 'bg-gold/5' : ''
                      }`}
                    >
                      <span
                        className={`block text-sm font-black ${
                          isCurrent ? 'text-gold' : 'text-foreground'
                        }`}
                      >
                        {pillarToKr(period.pillar)}
                      </span>
                      <span className="block text-[10px] text-[#b0b0b8] mt-0.5">
                        {period.pillar.stem}
                        {period.pillar.branch}
                      </span>
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-[#faf9f7]">
                {luck.majorLuck.slice(0, 8).map((period) => {
                  const tenGod = getTenGod(dayStem, period.pillar.stem);
                  const isCurrent = isCurrentPeriod(
                    period.startAge,
                    period.endAge,
                  );
                  return (
                    <td
                      key={period.startAge}
                      className={`py-1.5 text-center text-[10px] border-r border-white last:border-r-0 ${
                        isCurrent ? 'text-gold font-bold' : 'text-[#8a8a9a]'
                      }`}
                      title={TEN_GOD_FRIENDLY[tenGod]?.split('\n')[0] ?? ''}
                    >
                      {TEN_GOD_SHORT[tenGod]}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </DataSection>
    </>
  );
}
