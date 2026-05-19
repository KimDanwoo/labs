import { describe, it, expect } from 'vitest';

import {
  getShichenIndex,
  isEarlySubHour,
  getHourPillar,
} from '@entities/destiny/lib/hourPillar';

describe('getShichenIndex', () => {
  it.each([
    // 子시 (23:30~01:30)
    { hour: 23, minute: 30, expected: 0, label: '23:30 → 子(0)' },
    { hour: 0, minute: 0, expected: 0, label: '00:00 → 子(0)' },
    { hour: 1, minute: 29, expected: 0, label: '01:29 → 子(0)' },
    // 丑시 (01:30~03:30)
    { hour: 1, minute: 30, expected: 1, label: '01:30 → 丑(1)' },
    // 卯시 (05:30~07:30) — 05:30은 寅(2)가 아니라 卯(3)
    { hour: 5, minute: 30, expected: 3, label: '05:30 → 卯(3), 寅 아님' },
    // 午시 (11:30~13:30)
    { hour: 11, minute: 30, expected: 6, label: '11:30 → 午(6)' },
    // 亥시 (21:30~23:30)
    { hour: 21, minute: 30, expected: 11, label: '21:30 → 亥(11)' },
  ])('$label', ({ hour, minute, expected }) => {
    expect(getShichenIndex(hour, minute)).toBe(expected);
  });

  it('경계값: 03:29 → 丑(1)', () => {
    expect(getShichenIndex(3, 29)).toBe(1);
  });

  it('경계값: 03:30 → 寅(2)', () => {
    expect(getShichenIndex(3, 30)).toBe(2);
  });

  it('경계값: 05:29 → 寅(2)', () => {
    expect(getShichenIndex(5, 29)).toBe(2);
  });
});

describe('isEarlySubHour (야자시 판별)', () => {
  it.each([
    { hour: 23, minute: 29, expected: false, label: '23:29 → false' },
    { hour: 23, minute: 30, expected: true, label: '23:30 → true' },
    { hour: 23, minute: 59, expected: true, label: '23:59 → true' },
    { hour: 22, minute: 59, expected: false, label: '22:59 → false' },
    { hour: 0, minute: 0, expected: false, label: '00:00 → false' },
  ])('$label', ({ hour, minute, expected }) => {
    expect(isEarlySubHour(hour, minute)).toBe(expected);
  });
});

describe('getHourPillar', () => {
  it('甲일 子시(00:00) → 甲子', () => {
    const pillar = getHourPillar('甲', 0, 0);
    // 甲己일 → 자시 기준천간 甲, 子시 인덱스 0 → 甲子
    expect(pillar.stem).toBe('甲');
    expect(pillar.branch).toBe('子');
  });

  it('甲일 午시(12:00) → 庚午', () => {
    const pillar = getHourPillar('甲', 12, 0);
    // 甲己일 → 자시 기준 甲(index 0), 午시 인덱스 6 → (0+6)%10 = 6 → 庚
    expect(pillar.stem).toBe('庚');
    expect(pillar.branch).toBe('午');
  });

  it('丙일 子시(00:00) → 戊子', () => {
    const pillar = getHourPillar('丙', 0, 0);
    // 丙辛일 → 자시 기준 戊(index 4), 子시 인덱스 0 → 戊子
    expect(pillar.stem).toBe('戊');
    expect(pillar.branch).toBe('子');
  });

  it('戊일 未시(14:00) → 己未', () => {
    const pillar = getHourPillar('戊', 14, 0);
    // 戊癸일 → 자시 기준 壬(index 8), 未시 인덱스 7 → (8+7)%10 = 5 → 己
    expect(pillar.stem).toBe('己');
    expect(pillar.branch).toBe('未');
  });
});
