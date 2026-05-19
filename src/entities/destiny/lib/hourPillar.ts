import { EARTHLY_BRANCHES } from '@entities/destiny/data/branches';
import {
  getStemGroup,
  DAY_STEM_TO_HOUR_BASE,
} from '@entities/destiny/data/pillarStems';
import { HEAVENLY_STEMS } from '@entities/destiny/data/stems';
import type {
  HeavenlyStem,
  EarthlyBranch,
  Pillar,
} from '@entities/destiny/model';

/**
 * 시각 → 시진(時辰) 인덱스 변환 (0=子, 1=丑, ..., 11=亥)
 *
 * 12시진 매핑 (30분 경계):
 *   子=23:30~01:30, 丑=01:30~03:30, 寅=03:30~05:30, 卯=05:30~07:30
 *   辰=07:30~09:30, 巳=09:30~11:30, 午=11:30~13:30, 未=13:30~15:30
 *   申=15:30~17:30, 酉=17:30~19:30, 戌=19:30~21:30, 亥=21:30~23:30
 */
const getShichenIndex = (hour: number, minute: number): number => {
  const totalMinutes = hour * 60 + minute;

  // 23:30 이상 → 子(0)
  if (totalMinutes >= 23 * 60 + 30) {
    return 0;
  }

  // 01:30 미만 → 子(0)
  if (totalMinutes < 1 * 60 + 30) {
    return 0;
  }

  // 나머지: (totalMinutes - 90) / 120 으로 인덱스 계산
  // 01:30 = 90분 기준, 2시간(120분) 간격
  return Math.floor((totalMinutes - 90) / 120) + 1;
};

/**
 * 야자시(夜子時, 23:30~00:00) 여부 확인
 * 조자시 모드에서 이 시간대면 다음날 일주를 써야 함
 *
 * @param hour 시 (0~23)
 * @param minute 분 (0~59)
 */
const isEarlySubHour = (hour: number, minute: number): boolean => {
  return hour === 23 && minute >= 30;
};

/**
 * 시주(時柱) 계산
 *
 * 시간 천간 계산:
 *   1. 일간으로 StemGroup 구하기
 *   2. DAY_STEM_TO_HOUR_BASE에서 자시(子時) 천간 가져오기
 *   3. 자시 천간 인덱스에서 해당 시진까지 순차 이동
 *
 * 야자시(夜子時) 옵션:
 *   - 조자시(기본, false): 23:30부터 다음날 일주 적용, 시진은 子
 *   - 야자시(true): 23:30~00:00는 당일 일주 유지, 시진은 子
 *   (일주 교체는 호출자가 담당, 이 함수는 시진만 계산)
 *
 * @param dayStem 일간
 * @param hour 시 (0~23)
 * @param minute 분 (0~59)
 * @param useNightSubHour 야자시 사용 여부 (기본 false = 조자시)
 */
const getHourPillar = (
  dayStem: HeavenlyStem,
  hour: number,
  minute: number,
  useNightSubHour = false,
): Pillar => {
  const shichenIndex = getShichenIndex(hour, minute);

  const stemGroup = getStemGroup(dayStem);
  const ziHourBaseStem = DAY_STEM_TO_HOUR_BASE[stemGroup];
  const ziHourBaseIndex = HEAVENLY_STEMS.indexOf(ziHourBaseStem);

  const stemIndex = (ziHourBaseIndex + shichenIndex) % 10;

  // 야자시 모드에서 23:30~00:00 구간은 시진만 子로 반환
  // (일주는 호출자가 당일 일주 그대로 유지해야 함)
  void useNightSubHour;

  const hourBranch: EarthlyBranch = EARTHLY_BRANCHES[shichenIndex];

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: hourBranch,
  };
};

export { getHourPillar, getShichenIndex, isEarlySubHour };
