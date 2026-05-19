export { calculateDestiny } from './lib';

export type {
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  YinYang,
  TenGod,
  TwelveStage,
  Pillar,
  FourPillars,
  HiddenStem,
  HiddenStems,
  DestinyInput,
  DestinyResult,
} from './model';

export { STEM_DATA, HEAVENLY_STEMS } from './data';
export type { StemInfo } from './data';

export { BRANCH_DATA, EARTHLY_BRANCHES } from './data';
export type { BranchInfo } from './data';

export { SIXTY_JIAZI } from './data';
export { HIDDEN_STEMS_TABLE } from './data';

export {
  STEM_COMBINATIONS,
  BRANCH_SIX_COMBINATIONS,
  BRANCH_TRIPLE_COMBINATIONS,
  BRANCH_DIRECTION_COMBINATIONS,
  BRANCH_SIX_CONFLICTS,
  BRANCH_PUNISHMENTS,
  BRANCH_BREAKS,
  BRANCH_HARMS,
} from './data';
export type {
  StemCombination,
  BranchSixCombination,
  BranchTripleCombination,
  BranchDirectionCombination,
  PunishmentType,
  BranchPunishment,
} from './data';

export {
  TWELVE_STAGE_TABLE,
  TWELVE_STAGE_ORDER,
  STEM_BIRTH_BRANCH,
  STEM_IS_YANG,
} from './data';

export { VOID_TABLE, VOID_BY_CYCLE_INDEX } from './data';
export type { VoidEntry } from './data';

export {
  YEAR_STEM_TO_MONTH_BASE,
  DAY_STEM_TO_HOUR_BASE,
  getStemGroup,
} from './data';
export type { StemGroup } from './data';
