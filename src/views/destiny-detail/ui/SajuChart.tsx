import {
  BRANCH_KR,
  ELEMENT_COLOR,
  STEM_ELEMENT,
  STEM_KR,
} from '@views/destiny-result/constants';

import { HIDDEN_STEMS_TABLE } from '@entities/destiny/data/hiddenStems';
import type {
  TwelveStageAnalysis,
  TwelveSpiritAnalysis,
  TenGodAnalysis,
  LunarDate,
  ZodiacAnimal,
} from '@entities/destiny/lib';
import type {
  DestinyFormData,
  FourPillars,
  HeavenlyStem,
} from '@entities/destiny/model';

import { cn } from '@shared/lib/cn';

type SajuChartProps = {
  form: DestinyFormData;
  fourPillars: FourPillars;
  tenGods: TenGodAnalysis;
  twelveStages: TwelveStageAnalysis;
  twelveSpirits: TwelveSpiritAnalysis;
  zodiac: ZodiacAnimal;
  lunar: LunarDate | null;
};

const PILLAR_LABELS = ['시주', '일주', '월주', '년주'] as const;

function elementColor(stem: HeavenlyStem) {
  return ELEMENT_COLOR[STEM_ELEMENT[stem]];
}

function elementShort(stem: HeavenlyStem) {
  const map = { 木: '목', 火: '화', 土: '토', 金: '금', 水: '수' } as const;
  return map[STEM_ELEMENT[stem]];
}

export function SajuChart({
  form,
  fourPillars,
  tenGods,
  twelveStages,
  twelveSpirits,
  zodiac,
  lunar,
}: SajuChartProps) {
  const pillars = [
    fourPillars.hour,
    fourPillars.day,
    fourPillars.month,
    fourPillars.year,
  ];

  const stemGods = [
    tenGods.hourStem,
    '일간',
    tenGods.monthStem,
    tenGods.yearStem,
  ];

  const branchGods = [
    tenGods.hourBranch,
    tenGods.dayBranch,
    tenGods.monthBranch,
    tenGods.yearBranch,
  ];

  const stages = [
    twelveStages.hourBranch,
    twelveStages.dayBranch,
    twelveStages.monthBranch,
    twelveStages.yearBranch,
  ];

  const spirits = [
    twelveSpirits.hourBranch,
    twelveSpirits.dayBranch,
    twelveSpirits.monthBranch,
    twelveSpirits.yearBranch,
  ];

  const hiddenStems = pillars.map((p) => {
    const h = HIDDEN_STEMS_TABLE[p.branch];
    const stems: string[] = [];
    if (h.initial) stems.push(STEM_KR[h.initial.stem]);
    if (h.middle) stems.push(STEM_KR[h.middle.stem]);
    stems.push(STEM_KR[h.main.stem]);
    return stems.join('');
  });

  const fullName = form.name || '회원';
  const yearStemKr = STEM_KR[fourPillars.year.stem];
  const yearBranchKr = BRANCH_KR[fourPillars.year.branch];

  const ROW_STYLE = 'grid grid-cols-[2.8rem_1fr_1fr_1fr_1fr]';
  const CELL = 'py-2.5 flex items-center justify-center';
  const LABEL = 'text-[11px] text-[#999] font-medium';

  return (
    <div className="px-5 py-5">
      {/* 헤더 */}
      <div className="mb-5">
        <h2 className="text-lg font-black text-[#1a1a2e]">{fullName}</h2>
        <p className="text-sm text-[#555] mt-0.5">
          {yearStemKr}
          {yearBranchKr}({zodiac.fullName})
        </p>
        <div className="text-xs text-[#999] mt-1.5 leading-relaxed">
          <p>
            양 {form.year}.{String(form.month).padStart(2, '0')}.
            {String(form.day).padStart(2, '0')} {form.hour}:
            {String(form.minute).padStart(2, '0')}{' '}
            {form.gender === 'male' ? '남' : '여'}
            {form.region ? ` · ${form.region}` : ''}
          </p>
          {lunar && (
            <p>
              음{lunar.isIntercalation ? '(윤)' : ''} {lunar.year}.
              {String(lunar.month).padStart(2, '0')}.
              {String(lunar.day).padStart(2, '0')}
            </p>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* 헤더 행 */}
        <div className={cn(ROW_STYLE, 'bg-[#f5f3ef]')}>
          <div className={cn(CELL, LABEL)} />
          {PILLAR_LABELS.map((label) => (
            <div
              key={label}
              className={cn(CELL, 'text-xs font-semibold text-[#777]')}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 천간 */}
        <div className={cn(ROW_STYLE, 'border-b border-[#f0ede8]')}>
          <div className={cn(CELL, LABEL)}>천간</div>
          {pillars.map((p, i) => (
            <div key={`s-${i}`} className={cn(CELL, 'flex-col gap-0.5')}>
              <span className="text-xl font-black text-[#1a1a2e] leading-none">
                {STEM_KR[p.stem]}
                <span className="text-[#999] text-sm font-medium ml-0.5">
                  {p.stem}
                </span>
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color: elementColor(p.stem) }}
              >
                +{elementShort(p.stem)}
              </span>
            </div>
          ))}
        </div>

        {/* 천간 십성 */}
        <div
          className={cn(ROW_STYLE, 'border-b border-[#f0ede8] bg-[#faf9f7]')}
        >
          <div className={cn(CELL, LABEL)}>십성</div>
          {stemGods.map((god, i) => (
            <div
              key={`sg-${i}`}
              className={cn(
                CELL,
                'text-xs font-medium',
                god === '일간' ? 'text-gold font-bold' : 'text-[#555]',
              )}
            >
              {god}
            </div>
          ))}
        </div>

        {/* 지지 */}
        <div className={cn(ROW_STYLE, 'border-b border-[#f0ede8]')}>
          <div className={cn(CELL, LABEL)}>지지</div>
          {pillars.map((p, i) => {
            const mainHidden = HIDDEN_STEMS_TABLE[p.branch].main.stem;
            return (
              <div key={`b-${i}`} className={cn(CELL, 'flex-col gap-0.5')}>
                <span className="text-xl font-black text-[#1a1a2e] leading-none">
                  {BRANCH_KR[p.branch]}
                  <span className="text-[#999] text-sm font-medium ml-0.5">
                    {p.branch}
                  </span>
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: elementColor(mainHidden) }}
                >
                  +{elementShort(mainHidden)}
                </span>
              </div>
            );
          })}
        </div>

        {/* 지지 십성 */}
        <div
          className={cn(ROW_STYLE, 'border-b border-[#f0ede8] bg-[#faf9f7]')}
        >
          <div className={cn(CELL, LABEL)}>십성</div>
          {branchGods.map((god, i) => (
            <div
              key={`bg-${i}`}
              className={cn(CELL, 'text-xs font-medium text-[#555]')}
            >
              {god}
            </div>
          ))}
        </div>

        {/* 지장간 */}
        <div className={cn(ROW_STYLE, 'border-b border-[#f0ede8]')}>
          <div className={cn(CELL, LABEL)}>지장간</div>
          {hiddenStems.map((h, i) => (
            <div
              key={`hs-${i}`}
              className={cn(CELL, 'text-xs font-medium text-[#333]')}
            >
              {h}
            </div>
          ))}
        </div>

        {/* 12운성 */}
        <div
          className={cn(ROW_STYLE, 'border-b border-[#f0ede8] bg-[#faf9f7]')}
        >
          <div className={cn(CELL, LABEL)}>12운성</div>
          {stages.map((s, i) => (
            <div
              key={`st-${i}`}
              className={cn(CELL, 'text-xs font-medium text-[#333]')}
            >
              {s}
            </div>
          ))}
        </div>

        {/* 12신살 */}
        <div className={ROW_STYLE}>
          <div className={cn(CELL, LABEL)}>12신살</div>
          {spirits.map((s, i) => (
            <div
              key={`sp-${i}`}
              className={cn(CELL, 'text-xs font-medium text-[#333]')}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
