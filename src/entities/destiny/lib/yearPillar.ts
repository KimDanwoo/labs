import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@entities/destiny/data';
import type { Pillar } from '@entities/destiny/model';

import { gregorianToJdn } from '@shared/lib/julianDay';

import { findSolarTermJdn, jdnToKstDateTime } from './solarTerms';

/** 입춘 황경 */
const LICHUN_LONGITUDE = 315 as const;

/**
 * 연도로 년주 간지 계산
 * 천간 인덱스 = (year - 4) % 10
 * 지지 인덱스 = (year - 4) % 12
 */
const getYearPillarByYear = (year: number): Pillar => {
  const stemIndex = (((year - 4) % 10) + 10) % 10;
  const branchIndex = (((year - 4) % 12) + 12) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  };
};

/**
 * 년주(年柱) 계산
 *
 * 핵심: 입춘(立春, 황경 315°) 입기 시각이 년주 경계
 *   - 입춘 이전 출생 → 전년도 간지
 *   - 입춘 이후 출생 → 당년도 간지
 *
 * 입춘은 항상 2월 3~5일 사이이므로:
 *   - month >= 3 → 무조건 당년
 *   - month === 1 → 무조건 전년
 *   - month === 2 → 입춘 시각과 비교
 *
 * @param year 양력 연도
 * @param month 양력 월
 * @param day 양력 일
 * @param hour 시 (KST, 0~23)
 * @param minute 분 (0~59)
 */
const getYearPillar = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Pillar => {
  if (month >= 3) {
    return getYearPillarByYear(year);
  }

  if (month === 1) {
    return getYearPillarByYear(year - 1);
  }

  // month === 2: 입춘 시각과 비교
  const lichunJdn = findSolarTermJdn(year, LICHUN_LONGITUDE);
  const lichun = jdnToKstDateTime(lichunJdn);

  const currentJdn = gregorianToJdn(year, month, day);
  const lichunDateJdn = gregorianToJdn(lichun.year, lichun.month, lichun.day);

  if (currentJdn < lichunDateJdn) {
    return getYearPillarByYear(year - 1);
  }

  if (currentJdn > lichunDateJdn) {
    return getYearPillarByYear(year);
  }

  // 같은 날(입춘 당일): 분 단위로 비교
  const currentMinutes = hour * 60 + minute;
  const lichunMinutes = lichun.hour * 60 + lichun.minute;

  return currentMinutes >= lichunMinutes
    ? getYearPillarByYear(year)
    : getYearPillarByYear(year - 1);
};

export { getYearPillar, getYearPillarByYear };
