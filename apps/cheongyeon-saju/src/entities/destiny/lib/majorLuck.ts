import { gregorianToJdn } from '@shared/lib/julianDay';

import { SIXTY_JIAZI } from '../data/sixtyJiazi';
import { MONTH_BOUNDARY_TERMS } from '../data/solarTermsDb';
import { STEM_DATA } from '../data/stems';
import type { FourPillars, HeavenlyStem, Pillar } from '../model/types';

import { findSolarTermJdn } from './solarTerms';

type LuckDirection = 'forward' | 'backward';

type MajorLuckPeriod = {
  startAge: number;
  endAge: number;
  pillar: Pillar;
};

type AnnualLuck = {
  year: number;
  pillar: Pillar;
};

type LuckAnalysis = {
  direction: LuckDirection;
  startAge: number;
  majorLuck: MajorLuckPeriod[];
  annualLuck: AnnualLuck[];
};

/**
 * 대운 방향 결정
 * - 양남(甲丙戊庚壬년 남) + 음녀(乙丁己辛癸년 여) → 순행 (forward)
 * - 음남 + 양녀 → 역행 (backward)
 */
const getLuckDirection = (
  yearStem: HeavenlyStem,
  gender: 'male' | 'female',
): LuckDirection => {
  const isYangStem = STEM_DATA[yearStem].yinYang === '陽';
  const isMale = gender === 'male';

  const isForward = (isYangStem && isMale) || (!isYangStem && !isMale);
  return isForward ? 'forward' : 'backward';
};

/**
 * 출생일 JDN을 분 단위 타임스탬프로 변환 (KST → 비교용)
 */
const toMinuteTimestamp = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number => {
  const jdn = gregorianToJdn(year, month, day);
  // KST → UT: -9시간. JDN 정수는 UT 정오 기준이므로 정오로부터의 분 오프셋 계산
  const minutesFromJdnNoon = (hour - 9) * 60 + minute - 12 * 60;
  return jdn * 1440 + minutesFromJdnNoon;
};

/**
 * 절기 JDN을 분 단위 타임스탬프로 변환 (KST)
 *
 * findSolarTermJdn은 UT 기준 소수점 JDN을 반환.
 * 정수 JDN의 UT 정오(12:00)로부터의 경과 시간을 분으로 변환.
 */
const solarTermJdnToMinuteTimestamp = (jdn: number): number => {
  const intJdn = Math.floor(jdn);
  const frac = jdn - intJdn;
  // UT 시각: 정오(12:00) + frac * 24시간
  const utHoursFromNoon = frac * 24;
  const utTotalHours = 12 + utHoursFromNoon;
  // KST = UT + 9
  const kstTotalHours = utTotalHours + 9;
  const kstDayOffset = Math.floor(kstTotalHours / 24);
  const kstHours = kstTotalHours % 24;
  const kstMinutes = kstHours * 60;
  return (intJdn + kstDayOffset) * 1440 + kstMinutes;
};

/**
 * 대운 시작 나이 계산
 *
 * 1. 출생일의 분 단위 타임스탬프 산출
 * 2. 대운 방향에 따라:
 *    - 순행: 출생일 → 다음 절(節)까지 일수
 *    - 역행: 이전 절(節) → 출생일까지 일수
 * 3. 일수 ÷ 3 = 대운 시작 나이 (반올림)
 */
const calculateLuckStartAge = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  yearStem: HeavenlyStem,
  gender: 'male' | 'female',
): number => {
  const direction = getLuckDirection(yearStem, gender);
  const birthTimestamp = toMinuteTimestamp(year, month, day, hour, minute);

  // 전년~후년 범위의 12절 JDN을 모두 계산해 타임스탬프 정렬
  const termTimestamps: number[] = [];

  for (const checkYear of [year - 1, year, year + 1]) {
    for (const term of MONTH_BOUNDARY_TERMS) {
      const jdn = findSolarTermJdn(checkYear, term.longitude);
      termTimestamps.push(solarTermJdnToMinuteTimestamp(jdn));
    }
  }

  termTimestamps.sort((a, b) => a - b);

  let daysDiff: number;

  if (direction === 'forward') {
    // 출생일 이후 가장 가까운 절
    const nextTerm = termTimestamps.find((ts) => ts > birthTimestamp);
    if (nextTerm === undefined) {
      return 0;
    }
    daysDiff = (nextTerm - birthTimestamp) / 1440;
  } else {
    // 출생일 이전 가장 가까운 절
    const prevTerms = termTimestamps.filter((ts) => ts <= birthTimestamp);
    if (prevTerms.length === 0) {
      return 0;
    }
    const prevTerm = prevTerms[prevTerms.length - 1];
    daysDiff = (birthTimestamp - prevTerm) / 1440;
  }

  return Math.round(daysDiff / 3);
};

/**
 * 60갑자에서 특정 Pillar의 인덱스를 찾음
 */
const findJiaziIndex = (pillar: Pillar): number => {
  const idx = SIXTY_JIAZI.findIndex(
    (p) => p.stem === pillar.stem && p.branch === pillar.branch,
  );
  return idx === -1 ? 0 : idx;
};

/**
 * 대운 간지 배열 생성 (기본 10개)
 *
 * 월주 간지를 기준으로:
 * - 순행: 60갑자에서 +1씩 이동
 * - 역행: 60갑자에서 -1씩 이동
 * 각 대운은 10년간 지속
 */
const getMajorLuckPeriods = (
  monthPillar: Pillar,
  luckStartAge: number,
  direction: LuckDirection,
  count = 10,
): MajorLuckPeriod[] => {
  const baseIndex = findJiaziIndex(monthPillar);
  const periods: MajorLuckPeriod[] = [];

  for (let i = 0; i < count; i++) {
    const step = direction === 'forward' ? i + 1 : -(i + 1);
    const jiaziIndex = (((baseIndex + step) % 60) + 60) % 60;
    const pillar = SIXTY_JIAZI[jiaziIndex];
    const startAge = luckStartAge + i * 10;
    const endAge = startAge + 9;

    periods.push({ startAge, endAge, pillar });
  }

  return periods;
};

/**
 * 특정 기간의 세운 배열 생성
 *
 * 년간 = (year - 4) % 10 → HEAVENLY_STEMS 인덱스
 * 년지 = (year - 4) % 12 → EARTHLY_BRANCHES 인덱스
 */
const getAnnualLuck = (startYear: number, count: number): AnnualLuck[] => {
  const result: AnnualLuck[] = [];

  for (let i = 0; i < count; i++) {
    const year = startYear + i;
    const jiaziIndex = (((year - 4) % 60) + 60) % 60;
    const pillar = SIXTY_JIAZI[jiaziIndex];
    result.push({ year, pillar });
  }

  return result;
};

/**
 * 대운/세운 통합 분석
 */
const analyzeLuck = (
  fourPillars: FourPillars,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number,
  gender: 'male' | 'female',
  currentYear = new Date().getFullYear(),
): LuckAnalysis => {
  const yearStem = fourPillars.year.stem;
  const direction = getLuckDirection(yearStem, gender);

  const startAge = calculateLuckStartAge(
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    yearStem,
    gender,
  );

  const majorLuck = getMajorLuckPeriods(fourPillars.month, startAge, direction);

  // 현재 나이 기준 전후 5년씩(총 11년) 세운
  const currentAge = currentYear - birthYear;
  const annualStartYear = currentYear - Math.min(currentAge, 5);
  const annualLuck = getAnnualLuck(annualStartYear, 11);

  return {
    direction,
    startAge,
    majorLuck,
    annualLuck,
  };
};

export {
  getLuckDirection,
  calculateLuckStartAge,
  getMajorLuckPeriods,
  getAnnualLuck,
  analyzeLuck,
};
export type { LuckDirection, MajorLuckPeriod, AnnualLuck, LuckAnalysis };
