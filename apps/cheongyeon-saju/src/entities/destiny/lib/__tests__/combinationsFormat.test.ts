import { describe, expect, it } from 'vitest';

import { analyzeCombinations } from '@entities/destiny/lib/combinationsAnalysis';
import { analyzeFormat } from '@entities/destiny/lib/격국Analysis';
import type {
  EarthlyBranch,
  FourPillars,
  HeavenlyStem,
} from '@entities/destiny/model';

type PillarSpec = [HeavenlyStem, EarthlyBranch];

const pillars = ([y, m, d, h]: [
  PillarSpec,
  PillarSpec,
  PillarSpec,
  PillarSpec,
]): FourPillars => ({
  year: { stem: y[0], branch: y[1] },
  month: { stem: m[0], branch: m[1] },
  day: { stem: d[0], branch: d[1] },
  hour: { stem: h[0], branch: h[1] },
});

describe('삼합/반합 구분 (왕지 기준)', () => {
  it('구성 지지 3개가 모두 있으면 삼합이다', () => {
    const result = analyzeCombinations(
      pillars([
        ['甲', '寅'],
        ['丙', '午'],
        ['戊', '戌'],
        ['庚', '子'],
      ]),
    );
    const triple = result.branchTripleCombinations;
    expect(triple).toHaveLength(1);
    expect(triple[0]?.type).toBe('삼합');
    expect(triple[0]?.element).toBe('火');
  });

  it('왕지(午)를 포함한 2개는 반합이다', () => {
    const result = analyzeCombinations(
      pillars([
        ['丙', '午'],
        ['戊', '戌'],
        ['庚', '酉'],
        ['壬', '辰'],
      ]),
    );
    const triple = result.branchTripleCombinations;
    expect(triple).toHaveLength(1);
    expect(triple[0]?.type).toBe('반합');
    expect(triple[0]?.branches).toEqual(expect.arrayContaining(['午', '戌']));
  });

  it('왕지 없는 2개(寅·戌)는 합으로 잡지 않는다', () => {
    const result = analyzeCombinations(
      pillars([
        ['甲', '寅'],
        ['戊', '戌'],
        ['庚', '子'],
        ['乙', '未'],
      ]),
    );
    expect(result.branchTripleCombinations).toHaveLength(0);
  });

  it('방합도 3개면 방합, 왕지 포함 2개면 반방합이다', () => {
    const full = analyzeCombinations(
      pillars([
        ['甲', '寅'],
        ['乙', '卯'],
        ['戊', '辰'],
        ['庚', '午'],
      ]),
    );
    expect(full.branchDirectionCombinations[0]?.type).toBe('방합');

    const half = analyzeCombinations(
      pillars([
        ['乙', '卯'],
        ['戊', '辰'],
        ['庚', '申'],
        ['丙', '午'],
      ]),
    );
    expect(half.branchDirectionCombinations[0]?.type).toBe('반방합');
  });
});

describe('격국 — 월지 투출 원칙', () => {
  it('월지 중기가 천간에 투출되면 그 격을 우선한다 (庚일 寅월 丙투출 → 편관격)', () => {
    const format = analyzeFormat(
      pillars([
        ['壬', '子'],
        ['癸', '寅'],
        ['庚', '午'],
        ['丙', '卯'], // 寅의 중기 丙이 시간에 투출
      ]),
    );
    expect(format.tenGod).toBe('편관');
    expect(format.name).toBe('편관격');
  });

  it('투출된 지장간이 없으면 본기(정기)로 격을 정한다 (庚일 寅월 → 편재격)', () => {
    const format = analyzeFormat(
      pillars([
        ['壬', '子'],
        ['癸', '寅'],
        ['庚', '午'],
        ['辛', '卯'], // 甲·丙·戊 어느 것도 투출 안 됨
      ]),
    );
    expect(format.tenGod).toBe('편재');
    expect(format.name).toBe('편재격');
  });
});
