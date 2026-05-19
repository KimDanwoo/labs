import { describe, it, expect } from 'vitest';

import {
  getDayPillar,
  getDayPillarIndex,
} from '@entities/destiny/lib/dayPillar';

import { gregorianToJdn } from '@shared/lib/julianDay';

describe('getDayPillarIndex', () => {
  it('1900-01-01 (JDN 2415021) → 인덱스 10 (기준점)', () => {
    const jdn = gregorianToJdn(1900, 1, 1);
    expect(jdn).toBe(2415021);
    expect(getDayPillarIndex(jdn)).toBe(10);
  });

  it('2024-02-04 (JDN 2460345) → 인덱스 34', () => {
    const jdn = gregorianToJdn(2024, 2, 4);
    expect(getDayPillarIndex(jdn)).toBe(34);
  });

  it('1986-05-22 (JDN 2446573) → 인덱스 2', () => {
    const jdn = gregorianToJdn(1986, 5, 22);
    expect(jdn).toBe(2446573);
    // (2446573 - 2415021 + 10) % 60 = 31562 % 60 = 2
    expect(getDayPillarIndex(jdn)).toBe(2);
  });
});

describe('getDayPillar', () => {
  it('1900-01-01 → 甲戌 (인덱스 10: 甲=0, 戌=10)', () => {
    const pillar = getDayPillar(1900, 1, 1);
    expect(pillar.stem).toBe('甲');
    expect(pillar.branch).toBe('戌');
  });

  it('2024-02-04 → 戊戌 (인덱스 34: 戊=4, 戌=10)', () => {
    // index 34: stem = 34%10 = 4 → 戊, branch = 34%12 = 10 → 戌
    const pillar = getDayPillar(2024, 2, 4);
    expect(pillar.stem).toBe('戊');
    expect(pillar.branch).toBe('戌');
  });

  it('1986-05-22 → 丙寅 (인덱스 2: 丙=2, 寅=2)', () => {
    const pillar = getDayPillar(1986, 5, 22);
    expect(pillar.stem).toBe('丙');
    expect(pillar.branch).toBe('寅');
  });
});
