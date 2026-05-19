import type { EarthlyBranch } from '@entities/destiny/data/branches';
import type { HeavenlyStem } from '@entities/destiny/data/stems';

type TwelveStage =
  | '장생'
  | '목욕'
  | '관대'
  | '건록'
  | '제왕'
  | '쇠'
  | '병'
  | '사'
  | '묘'
  | '절'
  | '태'
  | '양';

const TWELVE_STAGE_ORDER: readonly TwelveStage[] = [
  '장생',
  '목욕',
  '관대',
  '건록',
  '제왕',
  '쇠',
  '병',
  '사',
  '묘',
  '절',
  '태',
  '양',
] as const;

const STEM_BIRTH_BRANCH: Record<HeavenlyStem, EarthlyBranch> = {
  甲: '亥',
  乙: '午',
  丙: '寅',
  丁: '酉',
  戊: '寅',
  己: '酉',
  庚: '巳',
  辛: '子',
  壬: '申',
  癸: '卯',
} as const;

// 양간(陽干): 순행(順行), 음간(陰干): 역행(逆行)
const STEM_IS_YANG: Record<HeavenlyStem, boolean> = {
  甲: true,
  乙: false,
  丙: true,
  丁: false,
  戊: true,
  己: false,
  庚: true,
  辛: false,
  壬: true,
  癸: false,
} as const;

const EARTHLY_BRANCH_ORDER: readonly EarthlyBranch[] = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const;

function buildTwelveStageTable(): Record<
  HeavenlyStem,
  Record<EarthlyBranch, TwelveStage>
> {
  const stems: HeavenlyStem[] = [
    '甲',
    '乙',
    '丙',
    '丁',
    '戊',
    '己',
    '庚',
    '辛',
    '壬',
    '癸',
  ];
  const result = {} as Record<HeavenlyStem, Record<EarthlyBranch, TwelveStage>>;

  for (const stem of stems) {
    const birthBranch = STEM_BIRTH_BRANCH[stem];
    const isYang = STEM_IS_YANG[stem];
    const startIndex = EARTHLY_BRANCH_ORDER.indexOf(birthBranch);
    const branchMap = {} as Record<EarthlyBranch, TwelveStage>;

    for (let i = 0; i < 12; i++) {
      const branchIndex = isYang
        ? (startIndex + i) % 12
        : (((startIndex - i) % 12) + 12) % 12;
      const branch = EARTHLY_BRANCH_ORDER[branchIndex];
      branchMap[branch] = TWELVE_STAGE_ORDER[i];
    }

    result[stem] = branchMap;
  }

  return result;
}

const TWELVE_STAGE_TABLE: Record<
  HeavenlyStem,
  Record<EarthlyBranch, TwelveStage>
> = buildTwelveStageTable();

export {
  TWELVE_STAGE_TABLE,
  TWELVE_STAGE_ORDER,
  STEM_BIRTH_BRANCH,
  STEM_IS_YANG,
};
export type { TwelveStage };
