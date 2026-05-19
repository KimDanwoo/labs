import {
  getStemGroup,
  YEAR_STEM_TO_MONTH_BASE,
} from '@entities/destiny/data/pillarStems';
import { getMonthBranchForDate } from '@entities/destiny/data/solarTermsDb';
import { HEAVENLY_STEMS } from '@entities/destiny/data/stems';
import type {
  HeavenlyStem,
  EarthlyBranch,
  Pillar,
} from '@entities/destiny/model';

/**
 * 월지(月支)로 월 오프셋 계산 (寅=0 기준)
 * 寅=0, 卯=1, 辰=2, 巳=3, 午=4, 未=5, 申=6, 酉=7, 戌=8, 亥=9, 子=10, 丑=11
 */
const BRANCH_TO_MONTH_OFFSET: Record<EarthlyBranch, number> = {
  寅: 0,
  卯: 1,
  辰: 2,
  巳: 3,
  午: 4,
  未: 5,
  申: 6,
  酉: 7,
  戌: 8,
  亥: 9,
  子: 10,
  丑: 11,
} as const;

/**
 * 월주(月柱) 계산
 *
 * 12절(節) 기준 월 경계 사용 (중기 아님):
 *   소한→丑, 입춘→寅, 경칩→卯, 청명→辰, 입하→巳, 망종→午
 *   소서→未, 입추→申, 백로→酉, 한로→戌, 입동→亥, 대설→子
 *
 * 월간 계산:
 *   1. 년간으로 StemGroup 구하기
 *   2. YEAR_STEM_TO_MONTH_BASE에서 인월(寅月) 천간 가져오기
 *   3. 인월 천간 인덱스에서 해당 월까지 순차 이동
 *
 * @param yearStem 년간 (입춘 경계 보정된 년주의 천간)
 * @param year 양력 연도
 * @param month 양력 월
 * @param day 양력 일
 * @param hour 시 (KST, 0~23)
 * @param minute 분 (0~59)
 */
const getMonthPillar = (
  yearStem: HeavenlyStem,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Pillar => {
  const { branch: monthBranch, termYear } = getMonthBranchForDate(
    year,
    month,
    day,
    hour,
    minute,
  );

  // 입춘 이전이면 termYear가 전년도 → 전년도 년간 기준으로 월간 계산
  const effectiveYearStem: HeavenlyStem =
    termYear === year ? yearStem : yearStem; // 호출자가 이미 입춘 보정된 yearStem을 넘겨주므로 그대로 사용

  const stemGroup = getStemGroup(effectiveYearStem);
  const inMonthBaseStem = YEAR_STEM_TO_MONTH_BASE[stemGroup];
  const inMonthBaseIndex = HEAVENLY_STEMS.indexOf(inMonthBaseStem);

  const monthOffset = BRANCH_TO_MONTH_OFFSET[monthBranch];
  const stemIndex = (inMonthBaseIndex + monthOffset) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: monthBranch,
  };
};

export { getMonthPillar };
