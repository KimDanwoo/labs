import { describe, it, expect } from 'vitest';

import {
  getSolarTermsForYear,
  findSolarTermJdn,
} from '@entities/destiny/lib/solarTerms';

/** KST 시각을 분 단위로 변환 */
const toMinutes = (hour: number, minute: number) => hour * 60 + minute;

describe('getSolarTermsForYear(2024)', () => {
  const terms2024 = getSolarTermsForYear(2024);

  it('24절기 개수 === 24', () => {
    expect(terms2024.length).toBe(24);
  });

  it('입춘(315°): 2024-02-04, KASI 17:27 기준 ±30분 이내', () => {
    const lichun = terms2024.find((t) => t.name === '입춘');
    expect(lichun).toBeDefined();
    expect(lichun!.year).toBe(2024);
    expect(lichun!.month).toBe(2);
    expect(lichun!.day).toBe(4);
    // 계산값 17:15, KASI 기준 17:27 → 12분 차 (30분 이내)
    const calcMinutes = toMinutes(lichun!.hour, lichun!.minute);
    const kasiMinutes = toMinutes(17, 27);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(30);
  });

  it('춘분(0°): 2024-03-20, KASI 12:06 기준 ±30분 이내', () => {
    const chunbun = terms2024.find((t) => t.name === '춘분');
    expect(chunbun).toBeDefined();
    expect(chunbun!.year).toBe(2024);
    expect(chunbun!.month).toBe(3);
    expect(chunbun!.day).toBe(20);
    // 계산값 12:26, KASI 기준 12:06 → 20분 차 (30분 이내)
    const calcMinutes = toMinutes(chunbun!.hour, chunbun!.minute);
    const kasiMinutes = toMinutes(12, 6);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(30);
  });

  it('하지(90°): 2024-06-21, KASI 05:51 기준 ±30분 이내', () => {
    const haji = terms2024.find((t) => t.name === '하지');
    expect(haji).toBeDefined();
    expect(haji!.year).toBe(2024);
    expect(haji!.month).toBe(6);
    expect(haji!.day).toBe(21);
    // 계산값 05:30, KASI 기준 05:51 → 21분 차 (30분 이내)
    const calcMinutes = toMinutes(haji!.hour, haji!.minute);
    const kasiMinutes = toMinutes(5, 51);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(30);
  });

  it('동지(270°): 2024-12-21, KASI 18:21 기준 ±30분 이내', () => {
    const dongji = terms2024.find((t) => t.name === '동지');
    expect(dongji).toBeDefined();
    expect(dongji!.year).toBe(2024);
    expect(dongji!.month).toBe(12);
    expect(dongji!.day).toBe(21);
    // 계산값 18:02, KASI 기준 18:21 → 19분 차 (30분 이내)
    const calcMinutes = toMinutes(dongji!.hour, dongji!.minute);
    const kasiMinutes = toMinutes(18, 21);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(30);
  });
});

describe('findSolarTermJdn', () => {
  it('2024년 입춘 JDN은 2460344 부근 (소수점 포함)', () => {
    const jdn = findSolarTermJdn(2024, 315);
    // 정수부 2460344, 소수부 ~0.84 (UT 20:14)
    expect(Math.floor(jdn)).toBe(2460344);
    expect(jdn).toBeGreaterThan(2460344.8);
    expect(jdn).toBeLessThan(2460344.9);
  });
});
