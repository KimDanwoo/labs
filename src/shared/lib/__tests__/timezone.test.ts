import { describe, it, expect } from 'vitest';

import {
  getUtcOffsetMinutes,
  adjustToHistoricalKst,
  adjustToSolarTime,
} from '@shared/lib/timezone';

describe('getUtcOffsetMinutes', () => {
  it('1900-01-01 → 508 (LMT +8:27:52, 1908-04-01 이전)', () => {
    const date = new Date(Date.UTC(1900, 0, 1));
    expect(getUtcOffsetMinutes(date)).toBe(508);
  });

  it('1910-01-01 → 510 (+8:30, 1908-04-01~1912-01-01 구간)', () => {
    const date = new Date(Date.UTC(1910, 0, 1));
    expect(getUtcOffsetMinutes(date)).toBe(510);
  });

  it('1950-01-01 → 540 (+9:00, 1912-01-01~1954-03-21 구간)', () => {
    // 참고: 1912~1954년은 KST+9 구간이므로 1950년은 540분
    // 스펙의 "1950년 → 510" 은 역사 기록 오류 — 실제 구현은 540 반환
    const date = new Date(Date.UTC(1950, 0, 1));
    expect(getUtcOffsetMinutes(date)).toBe(540);
  });

  it('1955-01-01 → 510 (+8:30, 1954-03-21~1961-08-10 구간)', () => {
    const date = new Date(Date.UTC(1955, 0, 1));
    expect(getUtcOffsetMinutes(date)).toBe(510);
  });

  it('2024-01-01 → 540 (+9:00, 현행)', () => {
    const date = new Date(Date.UTC(2024, 0, 1));
    expect(getUtcOffsetMinutes(date)).toBe(540);
  });
});

describe('adjustToSolarTime', () => {
  it('서울(127°) 기준 12:00 → 11:28 (32분 차감)', () => {
    // (135 - 127) × 4 = 32분 차감
    const result = adjustToSolarTime(12, 0);
    expect(result.hour).toBe(11);
    expect(result.minute).toBe(28);
  });

  it('12:30 → 11:58', () => {
    const result = adjustToSolarTime(12, 30);
    expect(result.hour).toBe(11);
    expect(result.minute).toBe(58);
  });

  it('00:10 → 23:38 (자정 이전으로 넘어감)', () => {
    const result = adjustToSolarTime(0, 10);
    expect(result.hour).toBe(23);
    expect(result.minute).toBe(38);
  });

  it('표준 경도(135°)와 동일하면 보정 없음', () => {
    const result = adjustToSolarTime(12, 0, 135);
    expect(result.hour).toBe(12);
    expect(result.minute).toBe(0);
  });
});

describe('adjustToHistoricalKst', () => {
  it('2024년 → 보정 없음 (현재와 동일한 +9:00)', () => {
    const result = adjustToHistoricalKst(2024, 6, 15, 12, 0);
    expect(result.hour).toBe(12);
    expect(result.minute).toBe(0);
    expect(result.dayOffset).toBe(0);
  });

  it('1950년 12:00 → 보정 없음 (1912~1954년은 +9:00으로 현재와 동일)', () => {
    // 1950년 구간 offset=540, 현재 offset=540 → 차이 0 → 보정 없음
    const result = adjustToHistoricalKst(1950, 1, 1, 12, 0);
    expect(result.hour).toBe(12);
    expect(result.minute).toBe(0);
    expect(result.dayOffset).toBe(0);
  });

  it('1955년 12:00 → 11:30 (-30분 보정, dayOffset: 0)', () => {
    // 1955년 구간 offset=510(+8:30), 현재 offset=540(+9:00)
    // diffMinutes = 510 - 540 = -30 → 12:00 - 30분 = 11:30
    const result = adjustToHistoricalKst(1955, 1, 1, 12, 0);
    expect(result.hour).toBe(11);
    expect(result.minute).toBe(30);
    expect(result.dayOffset).toBe(0);
  });

  it('1910년 00:10 → 23:40 이전날 (dayOffset: -1)', () => {
    // 1910년 구간 offset=510, diffMinutes=-30
    // 00:10 - 30분 = -20분 → 23:40, dayOffset=-1
    const result = adjustToHistoricalKst(1910, 6, 15, 0, 10);
    expect(result.hour).toBe(23);
    expect(result.minute).toBe(40);
    expect(result.dayOffset).toBe(-1);
  });

  it('1900년 → LMT 보정 (508 - 540 = -32분)', () => {
    // 1900년 구간 offset=508, diffMinutes = 508 - 540 = -32
    // 12:00 - 32분 = 11:28
    const result = adjustToHistoricalKst(1900, 6, 15, 12, 0);
    expect(result.hour).toBe(11);
    expect(result.minute).toBe(28);
    expect(result.dayOffset).toBe(0);
  });
});
