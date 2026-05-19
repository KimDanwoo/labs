'use client';

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

import { Button, ButtonGroup } from '@shared/ui';

export function DestinyResultView() {
  const form = useAtomValue(destinyFormAtom);
  const result = useAtomValue(destinyResultAtom);
  const router = useRouter();

  if (!form || !result) {
    router.replace('/input');
    return null;
  }

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
    <div className="flex flex-col w-full max-w-[500px] mx-auto relative bg-white">
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
          top="5%"
          left="18%"
          width="62%"
        />
      </WebtoonPanel>

      {/* ━━━ 2컷: 자기소개 + 인연 ━━━ */}
      <WebtoonPanel imageSrc="/result_2.png">
        <BubbleText
          text={`저는 청월이에요.\n${displayName}님의 사주를\n함께 풀어볼게요!`}
          top="4%"
          left="4%"
          width="48%"
        />
        <BubbleText
          text={`${displayName}님과\n인연이 닿아\n정말 기쁘네요!`}
          top="30%"
          right="4%"
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
          top="4%"
          left="4%"
          width="48%"
        />
        <BubbleText
          text="사주 속 관계의\n기운을 읽어볼게요."
          top="32%"
          right="4%"
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
      <LuckSection luck={luck} dayStem={dayStem} birthYear={form.year} />

      <ButtonGroup>
        <Button fullWidth onClick={() => router.push('/detail')}>
          상세 사주보기 →
        </Button>
        <Button variant="ghost" onClick={() => router.push('/')}>
          ← 처음으로
        </Button>
      </ButtonGroup>
    </div>
  );
}
