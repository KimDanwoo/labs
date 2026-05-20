'use client';

import { useEffect } from 'react';

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

export function DestinyDetailView() {
  const form = useAtomValue(destinyFormAtom);
  const result = useAtomValue(destinyResultAtom);
  const router = useRouter();

  useEffect(() => {
    if (!form || !result) {
      router.replace('/input');
    }
  }, [form, result, router]);

  if (!form || !result) return null;

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
    <div className="flex flex-col w-full bg-white">
      {/* 헤더 */}
      <div className="relative flex items-center justify-center px-6 pt-4 pb-3 bg-white sticky top-0 z-10">
        <Link
          href="/result"
          className="absolute left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 transition-colors hover:bg-gray-50"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="text-xs text-gray-400">총운 풀이</p>
          <h1 className="text-lg font-black text-[#1a1a2e]">
            {displayName}님의 총운
          </h1>
          <p className="text-xs mt-0.5" style={{ color: ELEMENT_COLOR[dayEl] }}>
            {ELEMENT_EMOJI[dayEl]} {STEM_KR[dayStem]}({dayStem}) 일간
          </p>
        </div>
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

      {/* 하단 버튼 */}
      <div className="px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 bg-white border-t border-gray-100">
        <Link
          href="/result"
          className="flex items-center justify-center w-full h-10 px-8 text-sm text-gray-400 rounded-full active:scale-[0.97] transition-all duration-200"
        >
          ← 사주 결과로
        </Link>
      </div>
    </div>
  );
}
