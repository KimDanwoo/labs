import type { DestinyInput, DestinyResult } from '@entities/destiny/model';

import { gregorianToJdn, jdnToGregorian } from '@shared/lib/julianDay';
import { adjustToHistoricalKst, adjustToSolarTime } from '@shared/lib/timezone';

import { analyzeBodyStrength } from './bodyStrengthAnalysis';
import { analyzeCombinations } from './combinationsAnalysis';
import { getDayPillar } from './dayPillar';
import { analyzeFiveElements } from './fiveElements';
import { getHourPillar, isEarlySubHour } from './hourPillar';
import { solarToLunar } from './lunarCalendar';
import { analyzeLuck } from './majorLuck';
import { getMonthPillar } from './monthPillar';
import { getEquationOfTimeMinutes } from './solarTerms';
import { analyzeTenGods } from './tenGods';
import { analyzeTwelveSpirits } from './twelveSpiritAnalysis';
import { analyzeTwelveStages } from './twelveStagesAnalysis';
import { analyzeVoid } from './voidAnalysis';
import { getYearPillar } from './yearPillar';
import { getZodiacAnimal } from './zodiacAnimal';
import { analyzeFormat } from './격국Analysis';
import { analyzeYongsin } from './용신Analysis';

/**
 * 사주팔자 통합 계산 함수
 *
 * 처리 순서:
 * 1. 음력 입력 검증 (Phase 2 미구현)
 * 2. 태양시 보정 (useSolarTime === true)
 * 3. 역사적 시간대 보정 (1961년 이전 자동 적용)
 * 4. 야자시/조자시 처리 → 일주 계산용 날짜 결정
 * 5. 사주 계산 (일주 → 년주 → 월주 → 시주 순)
 */
const calculateDestiny = (input: DestinyInput): DestinyResult => {
  if (input.isLunar) {
    throw new Error('음력 입력은 Phase 2에서 구현 예정입니다.');
  }

  let { year, month, day, hour, minute } = input;

  // 1. 진태양시 보정 (경도가 지정된 경우 자동 적용): 경도차 + 균시차
  if (input.longitude !== undefined) {
    const eotMinutes = getEquationOfTimeMinutes(
      gregorianToJdn(year, month, day),
    );
    const solarAdjusted = adjustToSolarTime(
      hour,
      minute,
      input.longitude,
      eotMinutes,
    );
    hour = solarAdjusted.hour;
    minute = solarAdjusted.minute;
  }

  // 2. 역사적 시간대 보정
  const historicalAdjusted = adjustToHistoricalKst(
    year,
    month,
    day,
    hour,
    minute,
  );
  hour = historicalAdjusted.hour;
  minute = historicalAdjusted.minute;

  if (historicalAdjusted.dayOffset !== 0) {
    const jdn = gregorianToJdn(year, month, day) + historicalAdjusted.dayOffset;
    const adjusted = jdnToGregorian(jdn);
    year = adjusted.year;
    month = adjusted.month;
    day = adjusted.day;
  }

  // 3. 야자시/조자시 처리: 일주 계산용 날짜 결정
  // 조자시 모드(기본): 23:30 이후면 다음날 일주 사용
  // 야자시 모드: 당일 일주 유지
  const useNightSubHour = input.useNightSubHour ?? false;
  let dayYear = year;
  let dayMonth = month;
  let dayDay = day;

  if (!useNightSubHour && isEarlySubHour(hour, minute)) {
    const jdn = gregorianToJdn(year, month, day) + 1;
    const nextDay = jdnToGregorian(jdn);
    dayYear = nextDay.year;
    dayMonth = nextDay.month;
    dayDay = nextDay.day;
  }

  // 4. 사주 계산 (일주 → 년주 → 월주 → 시주)
  const dayPillar = getDayPillar(dayYear, dayMonth, dayDay);
  const yearPillar = getYearPillar(year, month, day, hour, minute);
  const monthPillar = getMonthPillar(
    yearPillar.stem,
    year,
    month,
    day,
    hour,
    minute,
  );
  const hourPillar = getHourPillar(
    dayPillar.stem,
    hour,
    minute,
    useNightSubHour,
  );

  const fourPillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };

  const fiveElements = analyzeFiveElements(fourPillars);
  const tenGods = analyzeTenGods(fourPillars);
  const twelveStages = analyzeTwelveStages(fourPillars);
  const combinations = analyzeCombinations(fourPillars);
  const voidAnalysis = analyzeVoid(fourPillars);
  const luck = analyzeLuck(
    fourPillars,
    year,
    month,
    day,
    hour,
    minute,
    input.gender,
  );
  const bodyStrength = analyzeBodyStrength(tenGods);
  const format = analyzeFormat(fourPillars);
  const yongsin = analyzeYongsin(fiveElements, bodyStrength);
  const twelveSpirits = analyzeTwelveSpirits(fourPillars);
  const zodiac = getZodiacAnimal(
    fourPillars.year.stem,
    fourPillars.year.branch,
  );
  const lunar = solarToLunar(input.year, input.month, input.day);

  return {
    fourPillars,
    fiveElements,
    tenGods,
    twelveStages,
    twelveSpirits,
    combinations,
    voidAnalysis,
    luck,
    bodyStrength,
    format,
    yongsin,
    zodiac,
    lunar,
    input,
  };
};

export { calculateDestiny };
