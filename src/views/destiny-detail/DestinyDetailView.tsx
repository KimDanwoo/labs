'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtomValue } from 'jotai';

import {
  CAREER_BY_GOD,
  CAREER_NONE,
  HEALTH_BALANCED,
  HEALTH_BY_ELEMENT,
  ROMANCE_BY_GOD,
  ROMANCE_NONE,
  WEALTH_BY_GOD,
  WEALTH_NONE,
} from '@views/destiny-detail/constants';
import { AreaSection, Divider } from '@views/destiny-detail/ui';
import {
  ELEMENT_COLOR,
  ELEMENT_EMOJI,
  ELEMENT_KR,
  STEM_ELEMENT,
  STEM_KR,
} from '@views/destiny-result/constants';

import { destinyFormAtom, destinyResultAtom } from '@entities/destiny/model';
import type { TenGod } from '@entities/destiny/model';

import { Button, ButtonGroup } from '@shared/ui';

export function DestinyDetailView() {
  const form = useAtomValue(destinyFormAtom);
  const result = useAtomValue(destinyResultAtom);
  const router = useRouter();

  if (!form || !result) {
    router.replace('/input');
    return null;
  }

  const { fourPillars, fiveElements, tenGods } = result;
  const displayName = form.name || '회원';
  const dayStem = fourPillars.day.stem;
  const dayEl = STEM_ELEMENT[dayStem];
  const gender = form.gender;

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

  const romanceGods: TenGod[] =
    gender === 'male' ? ['편재', '정재'] : ['편관', '정관'];
  const topRomanceGod = romanceGods
    .filter((g) => godCounts[g])
    .sort((a, b) => (godCounts[b] ?? 0) - (godCounts[a] ?? 0))[0];
  const romance = topRomanceGod
    ? (ROMANCE_BY_GOD[topRomanceGod] ?? ROMANCE_NONE)
    : ROMANCE_NONE;

  const careerGods: TenGod[] = ['정관', '편관', '식신', '상관', '편인', '정인'];
  const topCareerGod = careerGods
    .filter((g) => godCounts[g])
    .sort((a, b) => (godCounts[b] ?? 0) - (godCounts[a] ?? 0))[0];
  const career = topCareerGod
    ? (CAREER_BY_GOD[topCareerGod] ?? CAREER_NONE)
    : CAREER_NONE;

  const wealthGods: TenGod[] = ['정재', '편재'];
  const topWealthGod = wealthGods
    .filter((g) => godCounts[g])
    .sort((a, b) => (godCounts[b] ?? 0) - (godCounts[a] ?? 0))[0];
  const wealth = topWealthGod
    ? (WEALTH_BY_GOD[topWealthGod] ?? WEALTH_NONE)
    : WEALTH_NONE;

  const missingEl = fiveElements.missing[0];
  const health = missingEl ? HEALTH_BY_ELEMENT[missingEl] : null;

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto relative bg-white">
      <Link
        href="/result"
        className="sticky top-4 left-4 z-20 w-10 h-10 ml-4 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 transition-colors hover:bg-gray-50"
      >
        ←
      </Link>

      {/* 헤더 */}
      <div className="bg-white px-6 pt-4 pb-6 text-center">
        <p className="text-xs text-gray-400 mb-1">총운 풀이</p>
        <h1 className="text-2xl font-black text-[#1a1a2e]">
          {displayName}님의 총운
        </h1>
        <p className="text-sm mt-1.5" style={{ color: ELEMENT_COLOR[dayEl] }}>
          {ELEMENT_EMOJI[dayEl]} {STEM_KR[dayStem]}({dayStem}) 일간
        </p>
      </div>

      <Divider />
      <AreaSection
        emoji="💕"
        title="연애·결혼운"
        godLabel={topRomanceGod}
        godTitle={romance.title}
        desc={romance.desc}
      />

      <Divider />
      <AreaSection
        emoji="💼"
        title="직업·커리어운"
        godLabel={topCareerGod}
        godTitle={career.title}
        desc={career.desc}
      />

      <Divider />
      <AreaSection
        emoji="💰"
        title="금전·재물운"
        godLabel={topWealthGod}
        godTitle={wealth.title}
        desc={wealth.desc}
      />

      <Divider />
      <div className="bg-[#faf9f7] px-5 py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💪</span>
          <h3 className="text-base font-black text-[#1a1a2e]">건강운</h3>
          {missingEl && (
            <span className="ml-auto text-[11px] text-[#8a8a9a] bg-white border border-gray-100 rounded-full px-2 py-0.5">
              {ELEMENT_KR[missingEl]} 부족
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {health ? (
            <>
              <p className="text-sm font-bold text-[#1a1a2e] mb-2">
                {ELEMENT_EMOJI[missingEl!]} {ELEMENT_KR[missingEl!]} —{' '}
                {health.organ} 주의
              </p>
              <p className="text-sm text-[#6b6b7b] leading-[1.8]">
                {health.desc}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-[#1a1a2e] mb-2">
                균형 잡힌 건강운
              </p>
              <p className="text-sm text-[#6b6b7b] leading-[1.8]">
                {HEALTH_BALANCED}
              </p>
            </>
          )}
        </div>
      </div>

      <ButtonGroup>
        <Button variant="ghost" onClick={() => router.push('/result')}>
          ← 사주 결과로
        </Button>
      </ButtonGroup>
    </div>
  );
}
