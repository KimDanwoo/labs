import { describe, expect, it } from 'vitest';

import { getMonthBranchForDate } from '@entities/destiny/data/solarTermsDb';
import { calculateDestiny } from '@entities/destiny/lib/calculateDestiny';
import { getSolarTermsForYear } from '@entities/destiny/lib/solarTerms';

// termTimestamp와 inputTimestamp의 기준 축이 어긋나면 절기 직전 최대 3시간
// 출생자의 월지가 "절기 이후"로 오판된다. 이 회귀를 방지한다.
describe('절기 경계 월지 판정 (축 정합성 회귀)', () => {
  it('입춘 1시간 전은 丑月, 1시간 후는 寅月이다', () => {
    const lichun = getSolarTermsForYear(2024).find((t) => t.longitude === 315);
    expect(lichun).toBeDefined();
    if (!lichun) return;

    // 입춘은 2월 4일 오후(~17시)라 ±1시간이 같은 날 안에 머문다.
    // 계산 오차(±6분)보다 충분히 이격돼 있어 판정이 안정적이다.
    const before = getMonthBranchForDate(
      lichun.year,
      lichun.month,
      lichun.day,
      lichun.hour - 1,
      lichun.minute,
    );
    const after = getMonthBranchForDate(
      lichun.year,
      lichun.month,
      lichun.day,
      lichun.hour + 1,
      lichun.minute,
    );

    expect(before.branch).toBe('丑');
    expect(after.branch).toBe('寅');
  });

  it('입춘 경계로 년주·월주가 함께 갈린다 (2024-02-04 16시 vs 18시)', () => {
    const beforeLichun = calculateDestiny({
      year: 2024,
      month: 2,
      day: 4,
      hour: 16,
      minute: 0,
      gender: 'male',
    });
    const afterLichun = calculateDestiny({
      year: 2024,
      month: 2,
      day: 4,
      hour: 18,
      minute: 0,
      gender: 'male',
    });

    // 입춘 이전 → 2023년(癸卯) 간지, 월지 丑
    expect(beforeLichun.fourPillars.year.stem).toBe('癸');
    expect(beforeLichun.fourPillars.year.branch).toBe('卯');
    expect(beforeLichun.fourPillars.month.branch).toBe('丑');

    // 입춘 이후 → 2024년(甲辰) 간지, 월지 寅
    expect(afterLichun.fourPillars.year.stem).toBe('甲');
    expect(afterLichun.fourPillars.year.branch).toBe('辰');
    expect(afterLichun.fourPillars.month.branch).toBe('寅');
  });
});
