import type { EarthlyBranch } from '@entities/destiny/data/branches';
import { getSolarTermsForYear } from '@entities/destiny/lib/solarTerms';
import type { SolarTermEntry } from '@entities/destiny/lib/solarTerms';

import { gregorianToJdn } from '@shared/lib/julianDay';

/** 월주 경계에 사용되는 12절(節) — 각 절이 시작되면 해당 지지의 월로 넘어감 */
const MONTH_BOUNDARY_TERMS = [
  { name: '소한', longitude: 285, monthBranch: '丑' as EarthlyBranch },
  { name: '입춘', longitude: 315, monthBranch: '寅' as EarthlyBranch },
  { name: '경칩', longitude: 345, monthBranch: '卯' as EarthlyBranch },
  { name: '청명', longitude: 15, monthBranch: '辰' as EarthlyBranch },
  { name: '입하', longitude: 45, monthBranch: '巳' as EarthlyBranch },
  { name: '망종', longitude: 75, monthBranch: '午' as EarthlyBranch },
  { name: '소서', longitude: 105, monthBranch: '未' as EarthlyBranch },
  { name: '입추', longitude: 135, monthBranch: '申' as EarthlyBranch },
  { name: '백로', longitude: 165, monthBranch: '酉' as EarthlyBranch },
  { name: '한로', longitude: 195, monthBranch: '戌' as EarthlyBranch },
  { name: '입동', longitude: 225, monthBranch: '亥' as EarthlyBranch },
  { name: '대설', longitude: 255, monthBranch: '子' as EarthlyBranch },
] as const;

type MonthBoundaryTerm = (typeof MONTH_BOUNDARY_TERMS)[number];

type MonthBranchResult = {
  branch: EarthlyBranch;
  /** 절기 기준 연도 (입춘 이전이면 전년도로 취급) */
  termYear: number;
};

/** 연도별 절기 캐시 */
const solarTermsCache = new Map<number, SolarTermEntry[]>();

/** 연도의 절기 목록을 캐시와 함께 조회 */
const getCachedSolarTerms = (year: number): SolarTermEntry[] => {
  const cached = solarTermsCache.get(year);
  if (cached !== undefined) return cached;

  const terms = getSolarTermsForYear(year);
  solarTermsCache.set(year, terms);
  return terms;
};

/**
 * 특정 날짜/시각이 어떤 월(月)에 속하는지 판단
 *
 * 사주에서 월주는 12절을 경계로 바뀜.
 * 입춘 이전이면 전년도 대설~소한 범위에 해당하므로 termYear는 전년도가 됨.
 *
 * @param year  그레고리력 연도
 * @param month 월 (1~12)
 * @param day   일
 * @param hour  시 (KST, 0~23)
 * @param minute 분 (0~59)
 * @returns { branch: EarthlyBranch, termYear: number }
 */
const getMonthBranchForDate = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): MonthBranchResult => {
  // KST 시각을 분 단위로 변환한 비교용 JDN+offset
  // gregorianToJdn은 정수 JDN 반환 (정오 UT 기준)
  // KST 입력을 UT로 변환: UT = KST - 9h
  const inputJdn = gregorianToJdn(year, month, day);
  // 정수 JDN 기준으로 분 단위 오프셋 계산 (KST → UT)
  const inputMinutesFromJdnNoon = (hour - 9) * 60 + minute - 12 * 60;
  // 전체 분 단위 타임스탬프 (비교용)
  const inputTimestamp = inputJdn * 1440 + inputMinutesFromJdnNoon;

  // 해당 연도와 전년도 절기를 모두 가져와서 12절만 필터링
  const boundaryLongitudes = new Set<number>(
    MONTH_BOUNDARY_TERMS.map((t) => t.longitude),
  );

  const termsThisYear = getCachedSolarTerms(year).filter((t) =>
    boundaryLongitudes.has(t.longitude),
  );
  const termsPrevYear = getCachedSolarTerms(year - 1).filter((t) =>
    boundaryLongitudes.has(t.longitude),
  );
  const termsNextYear = getCachedSolarTerms(year + 1).filter((t) =>
    boundaryLongitudes.has(t.longitude),
  );

  // 모든 경계 절기를 타임스탬프 순으로 정렬
  const allBoundaryTerms = [
    ...termsPrevYear,
    ...termsThisYear,
    ...termsNextYear,
  ]
    .map((t) => {
      const termJdnInt = Math.floor(t.jdn);
      const utHours = ((t.jdn - termJdnInt + 0.5) * 24) % 24;
      const kstHours = utHours + 9;
      const dayOffset = kstHours >= 24 ? 1 : 0;
      // 절기 시각을 분 단위 타임스탬프로 변환
      const termTimestamp =
        (termJdnInt + dayOffset) * 1440 + t.hour * 60 + t.minute;
      const boundary = MONTH_BOUNDARY_TERMS.find(
        (b) => b.longitude === t.longitude,
      ) as MonthBoundaryTerm;
      return { termTimestamp, branch: boundary.monthBranch, termYear: t.year };
    })
    .sort((a, b) => a.termTimestamp - b.termTimestamp);

  // inputTimestamp보다 작거나 같은 마지막 절기 찾기
  let result: MonthBranchResult | null = null;

  for (const term of allBoundaryTerms) {
    if (term.termTimestamp <= inputTimestamp) {
      result = { branch: term.branch, termYear: term.termYear };
    } else {
      break;
    }
  }

  // 전년도 12월 대설 이전이면 전전년도 마지막 절기 사용 (극히 드문 케이스)
  if (result === null) {
    const fallback = allBoundaryTerms[0];
    // 대설(子) 이전 → 해자월(亥) 적용: 전년도 입동
    result = { branch: fallback.branch, termYear: fallback.termYear };
  }

  return result;
};

export { MONTH_BOUNDARY_TERMS, getCachedSolarTerms, getMonthBranchForDate };
export type { MonthBranchResult };
