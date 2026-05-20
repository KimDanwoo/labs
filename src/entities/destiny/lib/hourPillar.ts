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
 * 전통 정시법 12시진 매핑 (정각 기준):
 *   子=23:00~01:00, 丑=01:00~03:00, 寅=03:00~05:00, 卯=05:00~07:00
 *   辰=07:00~09:00, 巳=09:00~11:00, 午=11:00~13:00, 未=13:00~15:00
 *   申=15:00~17:00, 酉=17:00~19:00, 戌=19:00~21:00, 亥=21:00~23:00
 */
const getShichenIndex = (hour: number): number => {
  // 23시 이상 → 子(0)
  if (hour >= 23) return 0;
  // 01시 미만 → 子(0)
  if (hour < 1) return 0;
  // 나머지: 2시간 간격
  return Math.floor((hour + 1) / 2);
};

/**
 * 야자시(夜子時, 23:00~00:00) 여부 확인
 * 조자시 모드에서 이 시간대면 다음날 일주를 써야 함
 */
const isEarlySubHour = (hour: number): boolean => {
  return hour >= 23;
};

/**
 * 시주(時柱) 계산
 *
 * 야자시(夜子時) 처리:
 *   - 조자시(기본, false): 23:00부터 다음날 일주 적용, 시간 천간도 다음날 기준
 *   - 야자시(true): 23:00~00:00는 당일 일주 유지, 시간 천간은 당일 기준
 *   (일주 교체는 호출자 calculateDestiny가 담당)
 */
const getHourPillar = (
  dayStem: HeavenlyStem,
  hour: number,
  _minute: number,
  useNightSubHour = false,
): Pillar => {
  const shichenIndex = getShichenIndex(hour);

  const stemGroup = getStemGroup(dayStem);
  const ziHourBaseStem = DAY_STEM_TO_HOUR_BASE[stemGroup];
  const ziHourBaseIndex = HEAVENLY_STEMS.indexOf(ziHourBaseStem);

  let stemIndex: number;

  if (useNightSubHour && hour >= 23) {
    // 야자시 모드: 23:00~24:00는 당일 일간 기준으로 자시 천간 계산
    // (dayStem은 호출자가 당일 일간을 넘겨줌)
    stemIndex = ziHourBaseIndex % 10;
  } else {
    stemIndex = (ziHourBaseIndex + shichenIndex) % 10;
  }

  const hourBranch: EarthlyBranch = EARTHLY_BRANCHES[shichenIndex];

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: hourBranch,
  };
};

export { getHourPillar, getShichenIndex, isEarlySubHour };
