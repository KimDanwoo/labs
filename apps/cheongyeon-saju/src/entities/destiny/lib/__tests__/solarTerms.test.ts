import { describe, it, expect } from 'vitest';

import {
  findSolarTermJdn,
  getEquationOfTimeMinutes,
  getSolarTermsForYear,
} from '@entities/destiny/lib/solarTerms';

import { gregorianToJdn } from '@shared/lib/julianDay';

/** KST 시각을 분 단위로 변환 */
const toMinutes = (hour: number, minute: number) => hour * 60 + minute;

describe('getSolarTermsForYear(2024)', () => {
  const terms2024 = getSolarTermsForYear(2024);

  it('24절기 개수 === 24', () => {
    expect(terms2024.length).toBe(24);
  });

  it('입춘(315°): 2024-02-04, KASI 17:27 기준 ±10분 이내', () => {
    const lichun = terms2024.find((t) => t.name === '입춘');
    expect(lichun).toBeDefined();
    expect(lichun!.year).toBe(2024);
    expect(lichun!.month).toBe(2);
    expect(lichun!.day).toBe(4);
    // 계산값 17:20, KASI 기준 17:27 → 7분 차
    const calcMinutes = toMinutes(lichun!.hour, lichun!.minute);
    const kasiMinutes = toMinutes(17, 27);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(10);
  });

  it('춘분(0°): 2024-03-20, KASI 12:06 기준 ±10분 이내', () => {
    const chunbun = terms2024.find((t) => t.name === '춘분');
    expect(chunbun).toBeDefined();
    expect(chunbun!.year).toBe(2024);
    expect(chunbun!.month).toBe(3);
    expect(chunbun!.day).toBe(20);
    // 계산값 12:05, KASI 기준 12:06 → 1분 차
    const calcMinutes = toMinutes(chunbun!.hour, chunbun!.minute);
    const kasiMinutes = toMinutes(12, 6);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(10);
  });

  it('하지(90°): 2024-06-21, KASI 05:51 기준 ±10분 이내', () => {
    const haji = terms2024.find((t) => t.name === '하지');
    expect(haji).toBeDefined();
    expect(haji!.year).toBe(2024);
    expect(haji!.month).toBe(6);
    expect(haji!.day).toBe(21);
    // 계산값 05:49, KASI 기준 05:51 → 2분 차
    const calcMinutes = toMinutes(haji!.hour, haji!.minute);
    const kasiMinutes = toMinutes(5, 51);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(10);
  });

  it('동지(270°): 2024-12-21, KASI 18:21 기준 ±10분 이내', () => {
    const dongji = terms2024.find((t) => t.name === '동지');
    expect(dongji).toBeDefined();
    expect(dongji!.year).toBe(2024);
    expect(dongji!.month).toBe(12);
    expect(dongji!.day).toBe(21);
    // 계산값 18:16, KASI 기준 18:21 → 5분 차
    const calcMinutes = toMinutes(dongji!.hour, dongji!.minute);
    const kasiMinutes = toMinutes(18, 21);
    expect(Math.abs(calcMinutes - kasiMinutes)).toBeLessThanOrEqual(10);
  });
});

describe('getEquationOfTimeMinutes (균시차)', () => {
  it('Meeus 예제 28.b: JDE 2448908.5 → +13분 42.7초 (±0.3분)', () => {
    const eot = getEquationOfTimeMinutes(2448908.5);
    // 13분 42.7초 = 13.712분
    expect(Math.abs(eot - 13.712)).toBeLessThanOrEqual(0.3);
  });

  it('2월 중순은 음(−), 11월 초는 양(+)의 큰 균시차', () => {
    const feb = getEquationOfTimeMinutes(gregorianToJdn(2024, 2, 11));
    const nov = getEquationOfTimeMinutes(gregorianToJdn(2024, 11, 3));
    // 연중 최소 ≈ −14분, 최대 ≈ +16분
    expect(feb).toBeLessThan(-12);
    expect(nov).toBeGreaterThan(14);
  });

  it('균시차는 항상 ±20분 이내다', () => {
    for (let m = 1; m <= 12; m++) {
      const eot = getEquationOfTimeMinutes(gregorianToJdn(2024, m, 15));
      expect(Math.abs(eot)).toBeLessThan(20);
    }
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
