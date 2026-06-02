'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtomValue } from 'jotai';

import {
  Divider,
  ElementSection,
  LuckSection,
  PersonalitySection,
  PillarSection,
  ScrollHint,
  StoryPanel,
  TenGodSection,
} from '@views/destiny-result/ui';

import { destinyFormAtom, destinyResultAtom } from '@entities/destiny/model';
import type { TenGod } from '@entities/destiny/model';

export function DestinyResultView() {
  const form = useAtomValue(destinyFormAtom);
  const result = useAtomValue(destinyResultAtom);
  const router = useRouter();

  useEffect(() => {
    if (!form || !result) {
      router.replace('/input');
    }
  }, [form, result, router]);

  if (!form || !result) return null;

  const {
    fourPillars,
    fiveElements,
    tenGods,
    twelveStages,
    luck,
    voidAnalysis,
    format,
  } = result;
  const dayStem = fourPillars.day.stem;
  const fullName = form.name || '회원';
  const displayName = fullName.length >= 3 ? fullName.slice(1) : fullName;

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
    <div className="flex flex-col w-full relative">
      <Link
        href="/input"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 transition-colors hover:bg-gray-50"
      >
        ←
      </Link>

      <ScrollHint />

      {/* ━━━ 1컷: 인사 (밝은 표정) ━━━ */}
      <StoryPanel
        variant="result_9"
        texts={[
          `${displayName}님,\n만나서 반가워요!\n저는 청월이에요.`,
          `${displayName}님과\n인연이 닿아\n기뻐요!`,
        ]}
        isFirst
      />

      {/* ━━━ 2컷: 사주 풀이 시작 ━━━ */}
      <StoryPanel
        variant="result_1"
        texts={[`${displayName}님의 사주를\n함께 풀어볼게요!`]}
      />

      <Divider label="총론" />

      <PillarSection
        fourPillars={fourPillars}
        input={form}
        displayName={displayName}
        voidAnalysis={voidAnalysis}
      />
      <ElementSection fiveElements={fiveElements} dayStem={dayStem} />

      <StoryPanel variant="result_3" />

      <Divider label="성격 · 기질" />

      <PersonalitySection
        dayStem={dayStem}
        bodyStrength={result.bodyStrength.strength}
        twelveStages={twelveStages}
        format={format}
      />

      {/* ━━━ 중간 전환: 깊은 분석 (생각하는 표정) ━━━ */}
      <StoryPanel
        variant="result_8"
        texts={[`잠깐, 여기서\n조금 더 깊이\n생각해볼게요…`]}
      />

      <StoryPanel
        variant="result_4"
        texts={[
          `사주 속에 숨겨진\n인연의 흐름이\n보여요!`,
          `${displayName}님의\n관계운을\n풀어볼게요.`,
        ]}
      />

      <Divider label="성향 · 관계" />

      <TenGodSection
        tenGods={tenGods}
        topGod={topGod}
        combinations={result.combinations}
      />

      <Divider label="운세 · 흐름" />

      <LuckSection luck={luck} dayStem={dayStem} birthYear={form.year} />

      {/* ━━━ 7컷: 상세 보기 유도 + 버튼 ━━━ */}
      <div className="relative pt-10 bg-white">
        <StoryPanel
          variant="result_7"
          texts={[
            `사실 아직\n반도 못 전했어요…\n${displayName}님만을 위한\n더 깊은 이야기가\n남아있답니다`,
            `더 알고 싶지\n않으세요?`,
          ]}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-10 px-6">
          <Link
            href="/detail"
            className="flex items-center justify-center w-full h-13 rounded-full bg-primary text-white font-bold tracking-wide shadow-lg shadow-primary/20 hover:bg-primary-bright active:scale-[0.97] transition-all duration-200 touch-manipulation"
          >
            상세 사주보기 →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-8 text-sm text-white/60 rounded-full active:scale-[0.97] transition-all duration-200"
          >
            ← 처음으로
          </Link>
        </div>
      </div>
    </div>
  );
}
