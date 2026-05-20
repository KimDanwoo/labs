'use client';

import { useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtomValue } from 'jotai';

import {
  BubbleText,
  Divider,
  ElementSection,
  LuckSection,
  PersonalitySection,
  PillarSection,
  TenGodSection,
  WebtoonPanel,
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
  const displayName = form.name || '회원';

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
        className="sticky top-4 left-4 z-20 w-10 h-10 ml-4 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 transition-colors hover:bg-gray-50"
      >
        ←
      </Link>

      {/* ━━━ 1컷: 인사 ━━━ */}
      <WebtoonPanel imageSrc="/result_1.png">
        <BubbleText
          text={`${displayName}님,\n만나서 반가워요!`}
          top="24%"
          left="21%"
          width="62%"
        />
      </WebtoonPanel>

      {/* ━━━ 2컷: 자기소개 + 인연 ━━━ */}
      <WebtoonPanel imageSrc="/result_2.png">
        <BubbleText
          text={`저는 청월이에요.\n${displayName}님의 사주를\n함께 풀어볼게요!`}
          top="13%"
          left="10%"
          width="48%"
        />
        <BubbleText
          text={`${displayName}님과\n인연이 닿아\n정말 기뻐요!`}
          top="29%"
          right="17%"
          width="40%"
        />
      </WebtoonPanel>

      <Divider label="총론" />
      <PillarSection
        fourPillars={fourPillars}
        input={form}
        displayName={displayName}
        voidAnalysis={voidAnalysis}
      />
      <ElementSection fiveElements={fiveElements} dayStem={dayStem} />

      <WebtoonPanel imageSrc="/result_3.png" />

      <Divider label="성격 · 기질" />
      <PersonalitySection
        dayStem={dayStem}
        bodyStrength={result.bodyStrength.strength}
        twelveStages={twelveStages}
        format={format}
      />

      <WebtoonPanel imageSrc="/result_4.png">
        <BubbleText
          text={`${displayName}님의 성향을\n더 자세히 볼게요!`}
          top="13%"
          left="12%"
          width="48%"
        />
        <BubbleText
          text="사주 속 관계의\n기운을 읽어볼게요."
          top="30%"
          right="28%"
          width="40%"
        />
      </WebtoonPanel>

      <Divider label="성향 · 관계" />
      <TenGodSection
        tenGods={tenGods}
        topGod={topGod}
        combinations={result.combinations}
      />

      <Divider label="운세 · 흐름" />
      <div className="relative">
        <LuckSection luck={luck} dayStem={dayStem} birthYear={form.year} />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-linear-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* ━━━ 7컷: 상세 보기 유도 + 버튼 ━━━ */}
      <div className="relative mt-10">
        <Image
          src="/result_7.jpeg"
          alt=""
          width={450}
          height={600}
          className="w-full h-auto block"
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <BubbleText
          text={`사실 아직\n절반도 못 말했어요…`}
          top="12%"
          left="34%"
          width="52%"
        />
        <BubbleText
          text={`더 알고 싶지\n않으세요?`}
          top="68%"
          right="3%"
          width="40%"
        />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-10 px-6">
          <Link
            href="/detail"
            className="flex items-center justify-center w-full h-13 rounded-full bg-gold text-[#0a0a1a] font-bold tracking-wide shadow-lg shadow-gold/20 hover:bg-gold-bright active:scale-[0.97] transition-all duration-200 touch-manipulation"
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
