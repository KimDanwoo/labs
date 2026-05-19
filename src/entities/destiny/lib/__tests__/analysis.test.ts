import { describe, it, expect } from 'vitest';

import { calculateDestiny } from '@entities/destiny/lib/calculateDestiny';
import type { DestinyInput } from '@entities/destiny/model';

// 테스트 케이스: 2024-06-15 14:00 남자
const INPUT: DestinyInput = {
  year: 2024,
  month: 6,
  day: 15,
  hour: 14,
  minute: 0,
  gender: 'male',
};

const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const;
const TEN_GODS = [
  '비견',
  '겁재',
  '식신',
  '상관',
  '편재',
  '정재',
  '편관',
  '정관',
  '편인',
  '정인',
] as const;
const TWELVE_STAGES = [
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

const result = calculateDestiny(INPUT);

describe('오행 분석', () => {
  it('counts에 5개 오행 키가 모두 존재한다', () => {
    for (const el of FIVE_ELEMENTS) {
      expect(result.fiveElements.counts).toHaveProperty(el);
      expect(typeof result.fiveElements.counts[el]).toBe('number');
    }
  });

  it('dominant, weak, missing은 배열이다', () => {
    expect(Array.isArray(result.fiveElements.dominant)).toBe(true);
    expect(Array.isArray(result.fiveElements.weak)).toBe(true);
    expect(Array.isArray(result.fiveElements.missing)).toBe(true);
  });

  it('dayMasterElement는 유효한 오행이다', () => {
    expect(FIVE_ELEMENTS).toContain(result.fiveElements.dayMasterElement);
  });

  it('dayMasterYinYang은 陽 또는 陰이다', () => {
    expect(['陽', '陰']).toContain(result.fiveElements.dayMasterYinYang);
  });

  it('dayMasterElement가 일간 오행과 일치한다', () => {
    expect(result.fiveElements.dayMasterElement).toBe(
      result.fiveElements.dayMasterElement,
    );
    // 일간은 庚(金)
    expect(result.fourPillars.day.stem).toBe('庚');
    expect(result.fiveElements.dayMasterElement).toBe('金');
  });
});

describe('십신 분석', () => {
  it('dayStem은 항상 비견이다', () => {
    expect(result.tenGods.dayStem).toBe('비견');
  });

  it('8개 위치 모두 유효한 십신 값이다', () => {
    const positions = [
      result.tenGods.yearStem,
      result.tenGods.yearBranch,
      result.tenGods.monthStem,
      result.tenGods.monthBranch,
      result.tenGods.dayStem,
      result.tenGods.dayBranch,
      result.tenGods.hourStem,
      result.tenGods.hourBranch,
    ];

    for (const god of positions) {
      expect(TEN_GODS).toContain(god);
    }
  });
});

describe('12운성 분석', () => {
  it('4개 지지 모두 유효한 12운성 값이다', () => {
    const stages = [
      result.twelveStages.yearBranch,
      result.twelveStages.monthBranch,
      result.twelveStages.dayBranch,
      result.twelveStages.hourBranch,
    ];

    for (const stage of stages) {
      expect(TWELVE_STAGES).toContain(stage);
    }
  });
});

describe('합충형파해 분석', () => {
  it('stemCombinations는 배열이다', () => {
    expect(Array.isArray(result.combinations.stemCombinations)).toBe(true);
  });

  it('branchSixCombinations는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchSixCombinations)).toBe(true);
  });

  it('branchTripleCombinations는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchTripleCombinations)).toBe(
      true,
    );
  });

  it('branchDirectionCombinations는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchDirectionCombinations)).toBe(
      true,
    );
  });

  it('branchConflicts는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchConflicts)).toBe(true);
  });

  it('branchPunishments는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchPunishments)).toBe(true);
  });

  it('branchBreaks는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchBreaks)).toBe(true);
  });

  it('branchHarms는 배열이다', () => {
    expect(Array.isArray(result.combinations.branchHarms)).toBe(true);
  });
});

describe('공망 분석', () => {
  it('voidBranches는 정확히 2개다', () => {
    expect(result.voidAnalysis.voidBranches).toHaveLength(2);
  });

  it('voidBranches의 각 항목은 유효한 지지다', () => {
    const BRANCHES = [
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
    for (const branch of result.voidAnalysis.voidBranches) {
      expect(BRANCHES).toContain(branch);
    }
  });

  it('affectedPillars는 배열이다', () => {
    expect(Array.isArray(result.voidAnalysis.affectedPillars)).toBe(true);
  });
});

describe('대운 분석', () => {
  it("direction은 'forward' 또는 'backward'다", () => {
    expect(['forward', 'backward']).toContain(result.luck.direction);
  });

  it('startAge는 0 이상 정수다', () => {
    expect(result.luck.startAge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.luck.startAge)).toBe(true);
  });

  it('majorLuck 배열이 비어있지 않다', () => {
    expect(result.luck.majorLuck.length).toBeGreaterThan(0);
  });

  it('각 majorLuck의 pillar가 유효한 간지다', () => {
    const STEMS = [
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
    ] as const;
    const BRANCHES = [
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

    for (const period of result.luck.majorLuck) {
      expect(STEMS).toContain(period.pillar.stem);
      expect(BRANCHES).toContain(period.pillar.branch);
      expect(period.startAge).toBeGreaterThanOrEqual(0);
      expect(period.endAge).toBeGreaterThan(period.startAge);
    }
  });

  it('annualLuck 배열이 비어있지 않다', () => {
    expect(result.luck.annualLuck.length).toBeGreaterThan(0);
  });

  it('양남(甲辰년 남자)은 순행이다', () => {
    // 2024년 甲辰년, 남자 → 양남 → 순행
    expect(result.luck.direction).toBe('forward');
  });
});
