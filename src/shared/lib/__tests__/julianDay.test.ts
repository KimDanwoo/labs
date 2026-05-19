import { describe, it, expect } from 'vitest';

import { gregorianToJdn, jdnToGregorian } from '@shared/lib/julianDay';

describe('gregorianToJdn', () => {
  it.each([
    { year: 1900, month: 1, day: 1, expected: 2415021 },
    { year: 2024, month: 2, day: 4, expected: 2460345 },
    { year: 2000, month: 1, day: 1, expected: 2451545 },
  ])('$year-$month-$day → JDN $expected', ({ year, month, day, expected }) => {
    expect(gregorianToJdn(year, month, day)).toBe(expected);
  });
});

describe('jdnToGregorian', () => {
  it.each([
    { jdn: 2415021, expected: { year: 1900, month: 1, day: 1 } },
    { jdn: 2460345, expected: { year: 2024, month: 2, day: 4 } },
    { jdn: 2451545, expected: { year: 2000, month: 1, day: 1 } },
  ])(
    'JDN $jdn → $expected.year-$expected.month-$expected.day',
    ({ jdn, expected }) => {
      expect(jdnToGregorian(jdn)).toEqual(expected);
    },
  );
});

describe('round-trip: 날짜 → JDN → 날짜', () => {
  it.each([
    { year: 1900, month: 1, day: 1 },
    { year: 1986, month: 5, day: 22 },
    { year: 2000, month: 6, day: 15 },
    { year: 2024, month: 2, day: 4 },
    { year: 2024, month: 12, day: 31 },
  ])('$year-$month-$day 라운드트립', ({ year, month, day }) => {
    const jdn = gregorianToJdn(year, month, day);
    expect(jdnToGregorian(jdn)).toEqual({ year, month, day });
  });
});
