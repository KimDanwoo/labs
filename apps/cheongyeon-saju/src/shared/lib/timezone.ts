// 한국 표준시 이력 오프셋 (분 단위)
const LMT_OFFSET_MINUTES = 8 * 60 + 27 + Math.round(52 / 60); // +8:27:52 → 508분
const KST_8_30_MINUTES = 8 * 60 + 30; // +8:30 → 510분
const KST_9_00_MINUTES = 9 * 60; // +9:00 → 540분

// 표준시 경도 및 서울 기준 경도
const STANDARD_MERIDIAN_DEGREES = 135;
const SEOUL_LONGITUDE_DEGREES = 127;
const MINUTES_PER_DEGREE = 4;

type KstEra = {
  untilYear: number;
  untilMonth: number; // 1-based
  untilDay: number;
  offsetMinutes: number;
};

// 각 구간의 종료 시점(exclusive)과 오프셋을 정의
// untilYear/Month/Day: 해당 구간이 끝나는 날짜 (이 날짜부터 다음 구간 적용)
const KST_HISTORY: KstEra[] = [
  {
    untilYear: 1908,
    untilMonth: 4,
    untilDay: 1,
    offsetMinutes: LMT_OFFSET_MINUTES,
  },
  {
    untilYear: 1912,
    untilMonth: 1,
    untilDay: 1,
    offsetMinutes: KST_8_30_MINUTES,
  },
  {
    untilYear: 1954,
    untilMonth: 3,
    untilDay: 21,
    offsetMinutes: KST_9_00_MINUTES,
  },
  {
    untilYear: 1961,
    untilMonth: 8,
    untilDay: 10,
    offsetMinutes: KST_8_30_MINUTES,
  },
];

const compareDateToEra = (
  year: number,
  month: number,
  day: number,
  era: KstEra,
): number => {
  if (year !== era.untilYear) return year - era.untilYear;
  if (month !== era.untilMonth) return month - era.untilMonth;
  return day - era.untilDay;
};

/**
 * 주어진 날짜의 한국 UTC 오프셋을 분(minutes) 단위로 반환합니다.
 * 예: 1950년 → 510 (UTC+8:30), 2024년 → 540 (UTC+9:00)
 */
const getUtcOffsetMinutes = (date: Date): number => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  for (const era of KST_HISTORY) {
    if (compareDateToEra(year, month, day, era) < 0) {
      return era.offsetMinutes;
    }
  }

  return KST_9_00_MINUTES;
};

type AdjustedTime = {
  hour: number;
  minute: number;
  dayOffset: number;
};

/**
 * 현재 KST(+9:00) 기준으로 입력된 시간을 해당 시대의 실제 시간으로 보정합니다.
 * 1961년 이전 출생자의 경우 표준시 차이만큼 조정됩니다.
 * dayOffset: 보정으로 인해 날짜가 바뀔 경우 -1 또는 +1, 그렇지 않으면 0
 */
const adjustToHistoricalKst = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): AdjustedTime => {
  const date = new Date(Date.UTC(year, month - 1, day));
  const historicalOffset = getUtcOffsetMinutes(date);
  const currentOffset = KST_9_00_MINUTES;

  const diffMinutes = historicalOffset - currentOffset;

  if (diffMinutes === 0) {
    return { hour, minute, dayOffset: 0 };
  }

  const totalMinutes = hour * 60 + minute + diffMinutes;
  const MINUTES_PER_DAY = 24 * 60;

  const normalizedMinutes =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  const adjustedHour = Math.floor(normalizedMinutes / 60);
  const adjustedMinute = normalizedMinutes % 60;

  let dayOffset = 0;
  if (totalMinutes < 0) dayOffset = -1;
  else if (totalMinutes >= MINUTES_PER_DAY) dayOffset = 1;

  return { hour: adjustedHour, minute: adjustedMinute, dayOffset };
};

type AdjustedSolarTime = {
  hour: number;
  minute: number;
};

/**
 * 진태양시(眞太陽時) 보정을 적용합니다.
 *
 * 두 가지 보정:
 * 1. 경도차: 표준시 경도(135°)와 출생지 경도의 차이. 경도 1°당 4분.
 * 2. 균시차: 진태양시 − 평균태양시 (날짜별 −14~+16분). 호출자가 계산해 전달.
 *
 * 진태양시 = 표준시 − 경도차 + 균시차
 *
 * @param equationOfTimeMinutes 균시차(분). 미지정 시 0(경도 보정만).
 */
const adjustToSolarTime = (
  hour: number,
  minute: number,
  longitudeDegrees: number = SEOUL_LONGITUDE_DEGREES,
  equationOfTimeMinutes: number = 0,
): AdjustedSolarTime => {
  const diffMinutes =
    (STANDARD_MERIDIAN_DEGREES - longitudeDegrees) * MINUTES_PER_DEGREE;

  const totalMinutes =
    hour * 60 + minute - diffMinutes + Math.round(equationOfTimeMinutes);
  const MINUTES_PER_DAY = 24 * 60;

  const normalizedMinutes =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  return {
    hour: Math.floor(normalizedMinutes / 60),
    minute: normalizedMinutes % 60,
  };
};

export { getUtcOffsetMinutes, adjustToHistoricalKst, adjustToSolarTime };
export type { AdjustedTime, AdjustedSolarTime };
