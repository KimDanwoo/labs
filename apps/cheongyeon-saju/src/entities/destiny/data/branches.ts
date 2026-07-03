import type { FiveElement, YinYang } from '@entities/destiny/data/elements';

type EarthlyBranch =
  | '子'
  | '丑'
  | '寅'
  | '卯'
  | '辰'
  | '巳'
  | '午'
  | '未'
  | '申'
  | '酉'
  | '戌'
  | '亥';

type BranchInfo = {
  element: FiveElement;
  yinYang: YinYang;
};

const BRANCH_DATA: Record<EarthlyBranch, BranchInfo> = {
  子: { element: '水', yinYang: '陽' },
  丑: { element: '土', yinYang: '陰' },
  寅: { element: '木', yinYang: '陽' },
  卯: { element: '木', yinYang: '陰' },
  辰: { element: '土', yinYang: '陽' },
  巳: { element: '火', yinYang: '陰' },
  午: { element: '火', yinYang: '陽' },
  未: { element: '土', yinYang: '陰' },
  申: { element: '金', yinYang: '陽' },
  酉: { element: '金', yinYang: '陰' },
  戌: { element: '土', yinYang: '陽' },
  亥: { element: '水', yinYang: '陰' },
} as const;

const EARTHLY_BRANCHES: readonly EarthlyBranch[] = [
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

// 지지별 시진 시각 범위 (한국 표준시 30분 보정 기준, 입력 SHICHEN_OPTIONS와 동일)
const BRANCH_HOUR_RANGE: Record<EarthlyBranch, string> = {
  子: '23:30~01:30',
  丑: '01:30~03:30',
  寅: '03:30~05:30',
  卯: '05:30~07:30',
  辰: '07:30~09:30',
  巳: '09:30~11:30',
  午: '11:30~13:30',
  未: '13:30~15:30',
  申: '15:30~17:30',
  酉: '17:30~19:30',
  戌: '19:30~21:30',
  亥: '21:30~23:30',
} as const;

export { BRANCH_DATA, EARTHLY_BRANCHES, BRANCH_HOUR_RANGE };
export type { EarthlyBranch, BranchInfo };
