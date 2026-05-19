'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { calculateDestiny } from '@entities/destiny/lib/calculateDestiny';
import type { FiveElementAnalysis } from '@entities/destiny/lib/fiveElements';
import type {
  FiveElement,
  Pillar,
  DestinyInput,
  TenGod,
} from '@entities/destiny/model';

import { cn } from '@shared/lib/cn';

import {
  BRANCH_KR,
  DAY_MASTER_STORY,
  ELEMENT_COLOR,
  ELEMENT_EMOJI,
  ELEMENT_KR,
  STEM_ELEMENT,
  STEM_KR,
  TEN_GOD_FRIENDLY,
  TWELVE_STAGE_FRIENDLY,
} from './constants';

// ── 유틸 ──

function pillarToKr(pillar: Pillar): string {
  return `${STEM_KR[pillar.stem]}${BRANCH_KR[pillar.branch]}`;
}

function parseDestinyInput(params: URLSearchParams): DestinyInput | null {
  const year = Number(params.get('year'));
  const month = Number(params.get('month'));
  const day = Number(params.get('day'));
  const hour = Number(params.get('hour'));
  const minute = Number(params.get('minute'));
  const gender = params.get('gender');

  if (
    !year ||
    !month ||
    !day ||
    isNaN(hour) ||
    isNaN(minute) ||
    (gender !== 'male' && gender !== 'female')
  ) {
    return null;
  }

  return { year, month, day, hour, minute, gender };
}

// ── 웹툰 패널 ──

function WebtoonPanel({
  imageSrc,
  children,
}: {
  imageSrc: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-background px-3 py-4">
      <div className="relative w-full rounded-xl overflow-hidden shadow-lg shadow-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="w-full h-auto block"
          draggable={false}
        />
        {children && (
          <div className="absolute inset-0 pointer-events-none">{children}</div>
        )}
      </div>
    </div>
  );
}

function BubbleText({ text, className }: { text: string; className?: string }) {
  return (
    <p
      className={cn(
        'text-[#1a1a2e] font-bold leading-snug whitespace-pre-line',
        className,
      )}
    >
      {text}
    </p>
  );
}

// ── 구분선 (웹툰 분위기) ──

function Divider({ label }: { label?: string }) {
  return (
    <div className="bg-background py-8 flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 w-full px-8">
        <span className="flex-1 h-px bg-gold/20" />
        {label && (
          <span className="text-gold/60 text-xs tracking-[0.3em] font-medium">
            {label}
          </span>
        )}
        <span className="flex-1 h-px bg-gold/20" />
      </div>
    </div>
  );
}

// ── 밝은 배경 데이터 섹션 ──

function DataSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-[#f5f0e8] px-5 py-6', className)}>{children}</div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center mb-5">
      <h3 className="text-xl font-black text-[#1a1a2e]">{title}</h3>
      {sub && <p className="text-xs text-[#6b6b7b] mt-1.5">{sub}</p>}
    </div>
  );
}

// ── 4기둥 카드 ──

function PillarCardLight({ label, pillar }: { label: string; pillar: Pillar }) {
  const el = STEM_ELEMENT[pillar.stem];
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-2xl py-4 px-2 shadow-sm">
      <span className="text-[10px] text-[#8a8a9a] font-medium">{label}</span>
      <span
        className="text-3xl font-black"
        style={{ color: ELEMENT_COLOR[el] }}
      >
        {pillar.stem}
      </span>
      <span className="text-3xl font-black text-[#1a1a2e]">
        {pillar.branch}
      </span>
      <span className="text-[11px] text-[#6b6b7b] font-medium">
        {STEM_KR[pillar.stem]}
        {BRANCH_KR[pillar.branch]}
      </span>
      <span
        className="text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-full"
        style={{
          color: ELEMENT_COLOR[el],
          backgroundColor: `${ELEMENT_COLOR[el]}15`,
        }}
      >
        {ELEMENT_KR[el]}
      </span>
    </div>
  );
}

// ── 오행 바 차트 ──

function ElementBarLight({
  fiveElements,
}: {
  fiveElements: FiveElementAnalysis;
}) {
  const max = Math.max(...Object.values(fiveElements.counts), 1);
  return (
    <div className="flex flex-col gap-3">
      {(Object.entries(fiveElements.counts) as [FiveElement, number][]).map(
        ([el, count]) => (
          <div key={el} className="flex items-center gap-3">
            <span className="text-lg w-7">{ELEMENT_EMOJI[el]}</span>
            <span className="text-sm text-[#6b6b7b] w-8 font-medium">
              {ELEMENT_KR[el]}
            </span>
            <div className="flex-1 h-5 bg-[#e8e0d0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: ELEMENT_COLOR[el],
                  opacity: count === 0 ? 0 : 0.85,
                }}
              />
            </div>
            <span
              className={cn(
                'w-5 text-right text-sm font-bold',
                count === 0 ? 'text-red' : 'text-[#1a1a2e]',
              )}
            >
              {count}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

// ── 메인 ──

export function DestinyResultView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const input = parseDestinyInput(searchParams);
  if (!input) {
    router.replace('/');
    return null;
  }

  const result = calculateDestiny(input);
  const { fourPillars, fiveElements, tenGods, twelveStages, luck } = result;

  const dayStem = fourPillars.day.stem;
  const name = searchParams.get('name') ?? '';
  const displayName = name || '회원';
  const dayEl = STEM_ELEMENT[dayStem];

  const dominantEls = fiveElements.dominant
    .map((e) => ELEMENT_KR[e])
    .join(', ');
  const missingEls = fiveElements.missing;

  // 십신 요약
  const godCounts: Partial<Record<TenGod, number>> = {};
  const allGods: TenGod[] = [
    tenGods.yearStem,
    tenGods.yearBranch,
    tenGods.monthStem,
    tenGods.monthBranch,
    tenGods.dayBranch,
    tenGods.hourStem,
    tenGods.hourBranch,
  ];
  for (const g of allGods) godCounts[g] = (godCounts[g] ?? 0) + 1;
  const topGodEntry = Object.entries(godCounts).sort((a, b) => b[1] - a[1])[0];
  const topGod = topGodEntry ? (topGodEntry[0] as TenGod) : null;

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto relative">
      {/* 뒤로가기 */}
      <Link
        href="/input"
        className="sticky top-4 left-4 z-20 w-10 h-10 ml-4 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80 transition-colors hover:bg-background/80"
      >
        ←
      </Link>

      {/* ━━━ 1컷: 인사 ━━━ */}
      <WebtoonPanel imageSrc="/result_1.png">
        <div className="absolute top-[3%] left-[8%] w-[45%] p-3">
          <BubbleText
            text={`${displayName}님,\n만나서 반가워요!\n사주를 봐드릴게요.`}
            className="text-[clamp(10px,2.8vw,14px)]"
          />
        </div>
      </WebtoonPanel>

      {/* ━━━ 2컷: 설명 ━━━ */}
      <WebtoonPanel imageSrc="/result_2.png">
        <div className="absolute top-[2%] left-[5%] w-[42%] p-3">
          <BubbleText
            text="사주팔자란 태어난 년, 월, 일, 시의 기운을 읽는 것이에요."
            className="text-[clamp(9px,2.4vw,12px)]"
          />
        </div>
        <div className="absolute bottom-[10%] right-[8%] w-[35%] p-2">
          <BubbleText
            text={`그럼 ${displayName}님의\n사주를 볼까요?`}
            className="text-[clamp(9px,2.4vw,12px)]"
          />
        </div>
      </WebtoonPanel>

      <Divider label="총론" />

      {/* ━━━ 총론 결과 블록: 사주 4기둥 + 오행 ━━━ */}
      <DataSection>
        <SectionTitle
          title="사주팔자"
          sub={`${input.year}년 ${input.month}월 ${input.day}일 · ${input.gender === 'male' ? '남' : '여'}`}
        />
        <div className="grid grid-cols-4 gap-2 mb-6">
          <PillarCardLight label="시주" pillar={fourPillars.hour} />
          <PillarCardLight label="일주" pillar={fourPillars.day} />
          <PillarCardLight label="월주" pillar={fourPillars.month} />
          <PillarCardLight label="년주" pillar={fourPillars.year} />
        </div>

        <SectionTitle
          title={`${ELEMENT_EMOJI[dayEl]} 오행 에너지`}
          sub={`강한 기운: ${dominantEls}${missingEls.length > 0 ? ` · 부족: ${missingEls.map((e) => ELEMENT_KR[e]).join(', ')}` : ' · 균형 잡힌 사주!'}`}
        />
        <div className="bg-white rounded-2xl p-4">
          <ElementBarLight fiveElements={fiveElements} />
        </div>
      </DataSection>

      {/* ━━━ 3컷: 전환 (붓으로 쓰는 장면) ━━━ */}
      <WebtoonPanel imageSrc="/result_3.png" />

      <Divider label="성격 · 기질" />

      {/* ━━━ 성격/기질 블록 ━━━ */}
      <DataSection>
        <SectionTitle
          title={`${ELEMENT_EMOJI[dayEl]} ${STEM_KR[dayStem]}(${dayStem})의 기운`}
          sub="일간 — 나의 본질적인 성격"
        />
        <div className="bg-white rounded-2xl p-5 mb-5">
          <p className="text-sm text-[#1a1a2e] leading-[1.8]">
            {DAY_MASTER_STORY[dayStem]}
          </p>
        </div>

        <SectionTitle
          title="인생의 에너지 흐름"
          sub="12운성 — 각 시기의 에너지 상태"
        />
        <div className="flex flex-col gap-2">
          {(
            [
              { label: '초년운 (년주)', stage: twelveStages.yearBranch },
              { label: '청년운 (월주)', stage: twelveStages.monthBranch },
              { label: '중년운 (일주)', stage: twelveStages.dayBranch },
              { label: '말년운 (시주)', stage: twelveStages.hourBranch },
            ] as const
          ).map(({ label, stage }) => (
            <div key={label} className="bg-white rounded-xl px-4 py-3">
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
          ))}
        </div>
      </DataSection>

      {/* ━━━ 4컷: 성향 소개 ━━━ */}
      <WebtoonPanel imageSrc="/result_4.png">
        <div className="absolute top-[2%] left-[5%] w-[42%] p-3">
          <BubbleText
            text={`${displayName}님의 성향을\n더 자세히 볼게요!`}
            className="text-[clamp(9px,2.5vw,13px)]"
          />
        </div>
        <div className="absolute bottom-[8%] right-[5%] w-[38%] p-2">
          <BubbleText
            text="사주 속 관계의\n기운을 읽어볼게요."
            className="text-[clamp(9px,2.4vw,12px)]"
          />
        </div>
      </WebtoonPanel>

      <Divider label="성향 · 관계" />

      {/* ━━━ 십신 블록 ━━━ */}
      <DataSection>
        <SectionTitle
          title="나의 성향 분석"
          sub="십신 — 사주 속 나의 기질과 관계"
        />
        {topGod && (
          <div className="bg-white rounded-xl p-4 mb-3">
            <p className="text-sm text-[#1a1a2e] font-semibold">
              가장 강한 기운: <span className="text-gold">{topGod}</span>
            </p>
            <p className="text-xs text-[#6b6b7b] mt-1">
              {TEN_GOD_FRIENDLY[topGod]}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {(
            [
              { label: '년주', god: tenGods.yearStem, desc: '조상/사회운' },
              { label: '월주', god: tenGods.monthStem, desc: '부모/직장운' },
              { label: '일주', god: tenGods.dayStem, desc: '나 자신' },
              { label: '시주', god: tenGods.hourStem, desc: '자녀/말년운' },
            ] as const
          ).map(({ label, god, desc }) => (
            <div key={label} className="bg-white rounded-xl px-4 py-3">
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
              <p className="text-xs text-[#6b6b7b] mt-1">
                {TEN_GOD_FRIENDLY[god]}
              </p>
            </div>
          ))}
        </div>
      </DataSection>

      {/* ━━━ 5컷: 재물/운세 (하단 카드 영역 있는 이미지) ━━━ */}
      <WebtoonPanel imageSrc="/result_5.png">
        <div className="absolute top-[2%] right-[5%] w-[45%] p-3">
          <BubbleText
            text={`앞으로의 운세\n흐름을 알려드릴게요 🌙`}
            className="text-[clamp(10px,2.8vw,14px)]"
          />
        </div>
      </WebtoonPanel>

      <Divider label="운세 · 흐름" />

      {/* ━━━ 대운 블록 ━━━ */}
      <DataSection>
        <SectionTitle title="10년 단위 운의 흐름" sub="대운 — 인생의 큰 물결" />
        <div className="bg-white rounded-xl p-4 mb-3">
          <p className="text-sm text-[#1a1a2e]">
            <span className="font-semibold text-gold">{luck.startAge}세</span>
            부터 시작 ·{' '}
            <span className="font-semibold">
              {luck.direction === 'forward' ? '순행 ▶' : '역행 ◀'}
            </span>
          </p>
          <p className="text-xs text-[#6b6b7b] mt-1">
            10년마다 새로운 기운이 찾아와요
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {luck.majorLuck.slice(0, 8).map((period) => (
            <div
              key={period.startAge}
              className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
            >
              <span className="text-sm text-[#6b6b7b]">
                {period.startAge}~{period.endAge}세
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#1a1a2e]">
                  {period.pillar.stem}
                  {period.pillar.branch}
                </span>
                <span className="text-xs text-[#8a8a9a]">
                  {pillarToKr(period.pillar)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </DataSection>

      {/* ━━━ 6컷: 마무리 ━━━ */}
      <WebtoonPanel imageSrc="/result_6.png">
        <div className="absolute top-[2%] left-[5%] w-[42%] p-3">
          <BubbleText
            text={`${displayName}님의 사주 분석은\n여기까지예요!`}
            className="text-[clamp(10px,2.8vw,14px)]"
          />
        </div>
        <div className="absolute bottom-[12%] right-[8%] w-[35%] p-2">
          <BubbleText
            text="좋은 기운은 살리고\n부족한 부분은 채워가세요 ✨"
            className="text-[clamp(9px,2.4vw,12px)]"
          />
        </div>
      </WebtoonPanel>

      {/* ━━━ 하단 ━━━ */}
      <div className="flex justify-center py-8 bg-background">
        <button
          type="button"
          onClick={() => router.push('/')}
          className={cn(
            'inline-flex items-center gap-2 h-12 px-8 rounded-full',
            'text-sm font-semibold text-muted',
            'bg-transparent border border-card-border',
            'transition-all duration-200 active:scale-[0.97]',
          )}
        >
          ← 처음으로 돌아가기
        </button>
      </div>
    </div>
  );
}
