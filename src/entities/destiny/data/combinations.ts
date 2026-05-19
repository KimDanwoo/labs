import type { EarthlyBranch } from '@entities/destiny/data/branches';
import type { FiveElement } from '@entities/destiny/data/elements';
import type { HeavenlyStem } from '@entities/destiny/data/stems';

type StemCombination = {
  stems: readonly [HeavenlyStem, HeavenlyStem];
  resultElement: FiveElement;
};

type BranchSixCombination = {
  branches: readonly [EarthlyBranch, EarthlyBranch];
  resultElement: FiveElement;
};

type BranchTripleCombination = {
  branches: readonly [EarthlyBranch, EarthlyBranch, EarthlyBranch];
  resultElement: FiveElement;
};

type BranchDirectionCombination = {
  branches: readonly [EarthlyBranch, EarthlyBranch, EarthlyBranch];
  resultElement: FiveElement;
};

type PunishmentType = '지세' | '무은' | '무례' | '자형';

type BranchPunishment =
  | {
      type: Extract<PunishmentType, '지세' | '무은'>;
      branches: readonly [EarthlyBranch, EarthlyBranch, EarthlyBranch];
    }
  | {
      type: Extract<PunishmentType, '무례'>;
      branches: readonly [EarthlyBranch, EarthlyBranch];
    }
  | {
      type: Extract<PunishmentType, '자형'>;
      branches: readonly [EarthlyBranch];
    };

// 천간합 (Heavenly Stem Combinations)
const STEM_COMBINATIONS: readonly StemCombination[] = [
  { stems: ['甲', '己'], resultElement: '土' },
  { stems: ['乙', '庚'], resultElement: '金' },
  { stems: ['丙', '辛'], resultElement: '水' },
  { stems: ['丁', '壬'], resultElement: '木' },
  { stems: ['戊', '癸'], resultElement: '火' },
] as const;

// 지지 육합 (Earthly Branch Six Combinations)
const BRANCH_SIX_COMBINATIONS: readonly BranchSixCombination[] = [
  { branches: ['子', '丑'], resultElement: '土' },
  { branches: ['寅', '亥'], resultElement: '木' },
  { branches: ['卯', '戌'], resultElement: '火' },
  { branches: ['辰', '酉'], resultElement: '金' },
  { branches: ['巳', '申'], resultElement: '水' },
  { branches: ['午', '未'], resultElement: '火' },
] as const;

// 삼합 (Triple Combinations)
const BRANCH_TRIPLE_COMBINATIONS: readonly BranchTripleCombination[] = [
  { branches: ['寅', '午', '戌'], resultElement: '火' },
  { branches: ['亥', '卯', '未'], resultElement: '木' },
  { branches: ['申', '子', '辰'], resultElement: '水' },
  { branches: ['巳', '酉', '丑'], resultElement: '金' },
] as const;

// 방합 (Direction Combinations)
const BRANCH_DIRECTION_COMBINATIONS: readonly BranchDirectionCombination[] = [
  { branches: ['寅', '卯', '辰'], resultElement: '木' },
  { branches: ['巳', '午', '未'], resultElement: '火' },
  { branches: ['申', '酉', '戌'], resultElement: '金' },
  { branches: ['亥', '子', '丑'], resultElement: '水' },
] as const;

// 육충 (Six Conflicts)
const BRANCH_SIX_CONFLICTS: readonly (readonly [
  EarthlyBranch,
  EarthlyBranch,
])[] = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥'],
] as const;

// 형 (Punishments)
const BRANCH_PUNISHMENTS: readonly BranchPunishment[] = [
  { type: '지세', branches: ['寅', '巳', '申'] },
  { type: '무은', branches: ['丑', '戌', '未'] },
  { type: '무례', branches: ['子', '卯'] },
  { type: '자형', branches: ['辰'] },
  { type: '자형', branches: ['午'] },
  { type: '자형', branches: ['酉'] },
  { type: '자형', branches: ['亥'] },
] as const;

// 파 (Breaks)
const BRANCH_BREAKS: readonly (readonly [EarthlyBranch, EarthlyBranch])[] = [
  ['子', '酉'],
  ['丑', '辰'],
  ['寅', '亥'],
  ['卯', '午'],
  ['巳', '申'],
  ['未', '戌'],
] as const;

// 해 (Harms)
const BRANCH_HARMS: readonly (readonly [EarthlyBranch, EarthlyBranch])[] = [
  ['子', '未'],
  ['丑', '午'],
  ['寅', '巳'],
  ['卯', '辰'],
  ['申', '亥'],
  ['酉', '戌'],
] as const;

export {
  STEM_COMBINATIONS,
  BRANCH_SIX_COMBINATIONS,
  BRANCH_TRIPLE_COMBINATIONS,
  BRANCH_DIRECTION_COMBINATIONS,
  BRANCH_SIX_CONFLICTS,
  BRANCH_PUNISHMENTS,
  BRANCH_BREAKS,
  BRANCH_HARMS,
};

export type {
  StemCombination,
  BranchSixCombination,
  BranchTripleCombination,
  BranchDirectionCombination,
  PunishmentType,
  BranchPunishment,
};
