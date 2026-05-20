import type { EarthlyBranch } from '@entities/destiny/data/branches';

import type { FourPillars } from '../model/types';

type TwelveSpirit =
  | '겁살'
  | '재살'
  | '천살'
  | '지살'
  | '연살'
  | '월살'
  | '망신살'
  | '장성살'
  | '반안살'
  | '역마살'
  | '육해살'
  | '화개살';

type TwelveSpiritAnalysis = {
  yearBranch: TwelveSpirit;
  monthBranch: TwelveSpirit;
  dayBranch: TwelveSpirit;
  hourBranch: TwelveSpirit;
};

const SPIRIT_ORDER: readonly TwelveSpirit[] = [
  '겁살',
  '재살',
  '천살',
  '지살',
  '연살',
  '월살',
  '망신살',
  '장성살',
  '반안살',
  '역마살',
  '육해살',
  '화개살',
];

const BRANCH_INDEX: Record<EarthlyBranch, number> = {
  子: 0,
  丑: 1,
  寅: 2,
  卯: 3,
  辰: 4,
  巳: 5,
  午: 6,
  未: 7,
  申: 8,
  酉: 9,
  戌: 10,
  亥: 11,
};

// 일지(日支) 기준 12신살 매핑
// 인오술(寅午戌) 삼합화국 → 겁살 = 亥
// 신자진(申子辰) 삼합수국 → 겁살 = 巳
// 사유축(巳酉丑) 삼합금국 → 겁살 = 寅
// 해묘미(亥卯未) 삼합목국 → 겁살 = 申
const SAMHAP_GROUP: Record<EarthlyBranch, number> = {
  寅: 0,
  午: 0,
  戌: 0,
  申: 1,
  子: 1,
  辰: 1,
  巳: 2,
  酉: 2,
  丑: 2,
  亥: 3,
  卯: 3,
  未: 3,
};

// 각 삼합 그룹의 겁살 시작 지지
const GEOBSAL_START: Record<number, EarthlyBranch> = {
  0: '亥', // 인오술 → 겁살 亥
  1: '巳', // 신자진 → 겁살 巳
  2: '寅', // 사유축 → 겁살 寅
  3: '申', // 해묘미 → 겁살 申
};

function getSpirit(
  dayBranch: EarthlyBranch,
  targetBranch: EarthlyBranch,
): TwelveSpirit {
  const group = SAMHAP_GROUP[dayBranch];
  const startBranch = GEOBSAL_START[group];
  const startIdx = BRANCH_INDEX[startBranch];
  const targetIdx = BRANCH_INDEX[targetBranch];
  const offset = (((targetIdx - startIdx) % 12) + 12) % 12;
  return SPIRIT_ORDER[offset];
}

function analyzeTwelveSpirits(fourPillars: FourPillars): TwelveSpiritAnalysis {
  const dayBranch = fourPillars.day.branch;
  return {
    yearBranch: getSpirit(dayBranch, fourPillars.year.branch),
    monthBranch: getSpirit(dayBranch, fourPillars.month.branch),
    dayBranch: getSpirit(dayBranch, fourPillars.day.branch),
    hourBranch: getSpirit(dayBranch, fourPillars.hour.branch),
  };
}

export { analyzeTwelveSpirits };
export type { TwelveSpirit, TwelveSpiritAnalysis };
