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

export { BRANCH_DATA, EARTHLY_BRANCHES };
export type { EarthlyBranch, BranchInfo };
