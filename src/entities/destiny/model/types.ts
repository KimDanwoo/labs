import type { EarthlyBranch } from '../data/branches';
import type { FiveElement, YinYang } from '../data/elements';
import type { HiddenStem, HiddenStems } from '../data/hiddenStems';
import type { Pillar } from '../data/pillar';
import type { HeavenlyStem } from '../data/stems';
import type { TwelveStage } from '../data/twelveStages';

type TenGod =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인';

type FourPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
};

type DestinyInput = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
  isLunar?: boolean;
  useNightSubHour?: boolean;
  useSolarTime?: boolean;
};

type DestinyFormData = DestinyInput & {
  name: string;
  region?: string;
  note?: string;
};

type DestinyResult = {
  fourPillars: FourPillars;
  fiveElements: import('../lib/fiveElements').FiveElementAnalysis;
  tenGods: import('../lib/tenGods').TenGodAnalysis;
  twelveStages: import('../lib/twelveStagesAnalysis').TwelveStageAnalysis;
  combinations: import('../lib/combinationsAnalysis').CombinationAnalysis;
  voidAnalysis: import('../lib/voidAnalysis').VoidAnalysis;
  luck: import('../lib/majorLuck').LuckAnalysis;
  bodyStrength: import('../lib/bodyStrengthAnalysis').BodyStrengthAnalysis;
  format: import('../lib/격국Analysis').FormatAnalysis;
  yongsin: import('../lib/용신Analysis').YongsinAnalysis;
  input: DestinyInput;
};

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
  DestinyFormData,
  DestinyResult,
};
