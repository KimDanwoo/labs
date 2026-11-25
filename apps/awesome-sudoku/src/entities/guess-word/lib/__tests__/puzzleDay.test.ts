import { answerIndex, puzzleDay } from '@entities/guess-word/lib/puzzleDay';
import { describe, expect, it } from 'vitest';

describe('puzzleDay', () => {
  it('2026-11-25 KST 자정에 1번 문제가 시작된다', () => {
    expect(puzzleDay(new Date('2026-11-24T15:00:00Z'))).toBe(1);
  });

  it('KST 자정 직전까지는 전날 문제다', () => {
    expect(puzzleDay(new Date('2026-11-25T14:59:59Z'))).toBe(1);
    expect(puzzleDay(new Date('2026-11-25T15:00:00Z'))).toBe(2);
  });
});

describe('answerIndex', () => {
  it('정답 목록을 다 쓰면 처음으로 돌아간다', () => {
    expect(answerIndex(1, 3)).toBe(0);
    expect(answerIndex(3, 3)).toBe(2);
    expect(answerIndex(4, 3)).toBe(0);
  });

  it('시작일 이전 날짜도 범위 안의 인덱스를 준다', () => {
    expect(answerIndex(0, 3)).toBe(2);
    expect(answerIndex(-1, 3)).toBe(1);
  });
});
