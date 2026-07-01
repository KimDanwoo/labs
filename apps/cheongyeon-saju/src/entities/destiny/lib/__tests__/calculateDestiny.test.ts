import { describe, it, expect } from 'vitest';

import { calculateDestiny } from '@entities/destiny/lib/calculateDestiny';
import type { DestinyInput } from '@entities/destiny/model';

const destiny = (
  overrides: Omit<DestinyInput, 'gender'> & { gender?: 'male' | 'female' },
) => calculateDestiny({ gender: 'male', ...overrides });

describe('케이스 1: 2024-02-04 10:00 (입춘 당일, 입춘 이전)', () => {
  /**
   * 2024년 입춘은 KST 17:15 (계산값) / 17:27 (KASI 기준)
   * 10:00은 입춘 이전이므로 년주는 癸卯(2023년)
   */
  const result = destiny({ year: 2024, month: 2, day: 4, hour: 10, minute: 0 });

  it('년주: 癸卯 (입춘 이전 → 2023년 간지)', () => {
    expect(result.fourPillars.year.stem).toBe('癸');
    expect(result.fourPillars.year.branch).toBe('卯');
  });

  it('월주: 乙丑 (입춘 이전 → 소한/대한 구간, 癸卯년 기준)', () => {
    expect(result.fourPillars.month.stem).toBe('乙');
    expect(result.fourPillars.month.branch).toBe('丑');
  });

  it('일주: 戊戌', () => {
    expect(result.fourPillars.day.stem).toBe('戊');
    expect(result.fourPillars.day.branch).toBe('戌');
  });

  it('시주: 丁巳 (巳시 09:30~11:30, 10:00은 巳시)', () => {
    expect(result.fourPillars.hour.stem).toBe('丁');
    expect(result.fourPillars.hour.branch).toBe('巳');
  });
});

describe('케이스 2: 2024-02-04 20:00 (입춘 이후)', () => {
  /**
   * 20:00은 입춘(17:15) 이후 → 년주 甲辰(2024년) 사용
   * 월주: 입춘 입기 후 → 寅월
   */
  const result = destiny({ year: 2024, month: 2, day: 4, hour: 20, minute: 0 });

  it('년주: 甲辰', () => {
    expect(result.fourPillars.year.stem).toBe('甲');
    expect(result.fourPillars.year.branch).toBe('辰');
  });

  it('월주: 丙寅 (입춘 이후 → 寅월)', () => {
    expect(result.fourPillars.month.stem).toBe('丙');
    expect(result.fourPillars.month.branch).toBe('寅');
  });

  it('일주: 戊戌', () => {
    expect(result.fourPillars.day.stem).toBe('戊');
    expect(result.fourPillars.day.branch).toBe('戌');
  });

  it('시주: 壬戌 (戌시 19:30~21:30)', () => {
    expect(result.fourPillars.hour.stem).toBe('壬');
    expect(result.fourPillars.hour.branch).toBe('戌');
  });
});

describe('케이스 3: 1986-05-22 14:00 남자', () => {
  /**
   * 일주 丙寅은 JDN 기반으로 검증 완료 (인덱스 2)
   * 년주: 丙寅 (1986년, 5월은 입춘 이후)
   */
  const result = destiny({
    year: 1986,
    month: 5,
    day: 22,
    hour: 14,
    minute: 0,
  });

  it('년주: 丙寅', () => {
    expect(result.fourPillars.year.stem).toBe('丙');
    expect(result.fourPillars.year.branch).toBe('寅');
  });

  it('월주: 癸巳 (5월 巳월)', () => {
    expect(result.fourPillars.month.stem).toBe('癸');
    expect(result.fourPillars.month.branch).toBe('巳');
  });

  it('일주: 丙寅 (인덱스 2 검증 완료)', () => {
    expect(result.fourPillars.day.stem).toBe('丙');
    expect(result.fourPillars.day.branch).toBe('寅');
  });

  it('시주: 乙未 (未시 13:30~15:30)', () => {
    expect(result.fourPillars.hour.stem).toBe('乙');
    expect(result.fourPillars.hour.branch).toBe('未');
  });
});

describe('케이스 4: 2000-01-01 00:00 여자 (입춘 전 → 1999년 간지)', () => {
  /**
   * 1월 1일은 입춘 이전이므로 전년도(1999년, 己卯) 간지 사용
   */
  const result = destiny({
    year: 2000,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    gender: 'female',
  });

  it('년주: 己卯 (입춘 전 → 1999년 간지)', () => {
    expect(result.fourPillars.year.stem).toBe('己');
    expect(result.fourPillars.year.branch).toBe('卯');
  });

  it('월주: 丙子 (12월 子월)', () => {
    expect(result.fourPillars.month.stem).toBe('丙');
    expect(result.fourPillars.month.branch).toBe('子');
  });

  it('일주: 戊午', () => {
    expect(result.fourPillars.day.stem).toBe('戊');
    expect(result.fourPillars.day.branch).toBe('午');
  });

  it('시주: 壬子 (子시 23:30~01:30)', () => {
    expect(result.fourPillars.hour.stem).toBe('壬');
    expect(result.fourPillars.hour.branch).toBe('子');
  });
});

describe('케이스 5: 1960-03-15 08:00 남자 (1961년 이전 시간대 보정)', () => {
  /**
   * 1960년은 1954-03-21~1961-08-10 구간 → +8:30 (510분)
   * 현재 KST+9(540분)와 차이 -30분 → 08:00 - 30분 = 07:30으로 보정
   * 辰시(07:30~09:30) 에 해당
   */
  const result = destiny({ year: 1960, month: 3, day: 15, hour: 8, minute: 0 });

  it('년주: 庚子', () => {
    expect(result.fourPillars.year.stem).toBe('庚');
    expect(result.fourPillars.year.branch).toBe('子');
  });

  it('월주: 己卯 (3월 卯월)', () => {
    expect(result.fourPillars.month.stem).toBe('己');
    expect(result.fourPillars.month.branch).toBe('卯');
  });

  it('일주: 壬寅', () => {
    expect(result.fourPillars.day.stem).toBe('壬');
    expect(result.fourPillars.day.branch).toBe('寅');
  });

  it('시주: 甲辰 (시간대 보정 후 07:30 → 辰시)', () => {
    expect(result.fourPillars.hour.stem).toBe('甲');
    expect(result.fourPillars.hour.branch).toBe('辰');
  });
});

describe('케이스 6: 23:45 출생 — 조자시 vs 야자시 비교', () => {
  /**
   * 기준: 2024-06-15 23:45
   * 조자시(기본): 23:30 이후이므로 일주는 다음날(6월 16일) 기준
   * 야자시: 당일(6월 15일) 일주 유지
   */

  describe('조자시(기본, useNightSubHour: false)', () => {
    const result = destiny({
      year: 2024,
      month: 6,
      day: 15,
      hour: 23,
      minute: 45,
    });

    it('일주: 辛亥 (다음날 6월 16일 기준)', () => {
      expect(result.fourPillars.day.stem).toBe('辛');
      expect(result.fourPillars.day.branch).toBe('亥');
    });

    it('시주: 戊子 (子시)', () => {
      expect(result.fourPillars.hour.stem).toBe('戊');
      expect(result.fourPillars.hour.branch).toBe('子');
    });
  });

  describe('야자시(useNightSubHour: true)', () => {
    const result = destiny({
      year: 2024,
      month: 6,
      day: 15,
      hour: 23,
      minute: 45,
      useNightSubHour: true,
    });

    it('일주: 庚戌 (당일 6월 15일 기준)', () => {
      expect(result.fourPillars.day.stem).toBe('庚');
      expect(result.fourPillars.day.branch).toBe('戌');
    });

    it('시주: 丙子 (子시, 당일 일간 庚 기준)', () => {
      expect(result.fourPillars.hour.stem).toBe('丙');
      expect(result.fourPillars.hour.branch).toBe('子');
    });
  });

  it('조자시/야자시에서 일주 stem이 서로 다름', () => {
    const josi = destiny({
      year: 2024,
      month: 6,
      day: 15,
      hour: 23,
      minute: 45,
    });
    const yajasi = destiny({
      year: 2024,
      month: 6,
      day: 15,
      hour: 23,
      minute: 45,
      useNightSubHour: true,
    });
    expect(josi.fourPillars.day.stem).not.toBe(yajasi.fourPillars.day.stem);
  });
});
