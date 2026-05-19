import type { EarthlyBranch } from '@entities/destiny/data/branches';
import type { HeavenlyStem } from '@entities/destiny/data/stems';

type HiddenStem = {
  stem: HeavenlyStem;
  days: number;
};

type HiddenStems = {
  initial?: HiddenStem;
  middle?: HiddenStem;
  main: HiddenStem;
};

const HIDDEN_STEMS_TABLE: Record<EarthlyBranch, HiddenStems> = {
  子: {
    initial: { stem: '壬', days: 10 },
    main: { stem: '癸', days: 20 },
  },
  丑: {
    initial: { stem: '癸', days: 9 },
    middle: { stem: '辛', days: 3 },
    main: { stem: '己', days: 18 },
  },
  寅: {
    initial: { stem: '戊', days: 7 },
    middle: { stem: '丙', days: 7 },
    main: { stem: '甲', days: 16 },
  },
  卯: {
    initial: { stem: '甲', days: 10 },
    main: { stem: '乙', days: 20 },
  },
  辰: {
    initial: { stem: '乙', days: 9 },
    middle: { stem: '癸', days: 3 },
    main: { stem: '戊', days: 18 },
  },
  巳: {
    initial: { stem: '戊', days: 7 },
    middle: { stem: '庚', days: 7 },
    main: { stem: '丙', days: 16 },
  },
  午: {
    initial: { stem: '丙', days: 10 },
    middle: { stem: '己', days: 9 },
    main: { stem: '丁', days: 11 },
  },
  未: {
    initial: { stem: '丁', days: 9 },
    middle: { stem: '乙', days: 3 },
    main: { stem: '己', days: 18 },
  },
  申: {
    initial: { stem: '戊', days: 7 },
    middle: { stem: '壬', days: 7 },
    main: { stem: '庚', days: 16 },
  },
  酉: {
    initial: { stem: '庚', days: 10 },
    main: { stem: '辛', days: 20 },
  },
  戌: {
    initial: { stem: '辛', days: 9 },
    middle: { stem: '丁', days: 3 },
    main: { stem: '戊', days: 18 },
  },
  亥: {
    initial: { stem: '戊', days: 7 },
    middle: { stem: '甲', days: 7 },
    main: { stem: '壬', days: 16 },
  },
} as const;

export { HIDDEN_STEMS_TABLE };
export type { HiddenStem, HiddenStems };
