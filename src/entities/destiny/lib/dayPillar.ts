import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@entities/destiny/data';
import type { Pillar } from '@entities/destiny/model';

import { gregorianToJdn } from '@shared/lib/julianDay';

/**
 * 기준: 1900-01-01 = JDN 2415021 = 甲戌일 (60갑자 인덱스 10)
 */
const BASE_JDN = 2415021 as const;
const BASE_INDEX = 10 as const;
const SEXAGENARY_CYCLE = 60 as const;

/**
 * JDN으로 일주(日柱) 인덱스 계산 (0~59)
 *
 * known-good 검증값:
 * - JDN 2415021 (1900-01-01) → 인덱스 10 (甲戌)
 * - JDN 2460345 (2024-02-04) → 인덱스 (2460345 - 2415021 + 10) % 60 = 34 (戊午)
 * - JDN 2446573 (1986-05-22) → 인덱스 (2446573 - 2415021 + 10) % 60 = 2 (丙寅)
 */
const getDayPillarIndex = (jdn: number): number => {
  return (
    (((jdn - BASE_JDN + BASE_INDEX) % SEXAGENARY_CYCLE) + SEXAGENARY_CYCLE) %
    SEXAGENARY_CYCLE
  );
};

/**
 * 일주(日柱) 계산
 * @param year 연도 (그레고리력)
 * @param month 월 (1~12)
 * @param day 일 (1~31)
 */
const getDayPillar = (year: number, month: number, day: number): Pillar => {
  const jdn = gregorianToJdn(year, month, day);
  const index = getDayPillarIndex(jdn);

  return {
    stem: HEAVENLY_STEMS[index % 10],
    branch: EARTHLY_BRANCHES[index % 12],
  };
};

export { getDayPillarIndex, getDayPillar };
