import { formatTime } from '@shared/lib/formatTime';
import { describe, expect, test } from 'vitest';

describe('formatTime', () => {
  test('0초를 올바르게 포맷팅해야 한다', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  test('59초 이하를 올바르게 포맷팅해야 한다', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(59)).toBe('00:59');
  });

  test('정확히 1분을 올바르게 포맷팅해야 한다', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  test('1분 이상을 올바르게 포맷팅해야 한다', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(3661)).toBe('61:01');
  });

  test('긴 시간을 올바르게 포맷팅해야 한다', () => {
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
  });

  test('한 자리 숫자를 두 자리로 패딩해야 한다', () => {
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(69)).toBe('01:09');
  });

  test('다양한 시간 값들이 올바르게 포맷팅되어야 한다', () => {
    const testCases = [
      { input: 0, expected: '00:00' },
      { input: 1, expected: '00:01' },
      { input: 59, expected: '00:59' },
      { input: 60, expected: '01:00' },
      { input: 61, expected: '01:01' },
      { input: 3661, expected: '61:01' },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(formatTime(input)).toBe(expected);
    });
  });
});
