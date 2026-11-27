import { describe, expect, it } from 'vitest';

import { formatKoreanDate } from '@views/game-library/lib/formatKoreanDate';

describe('formatKoreanDate', () => {
  it('한국 시간 기준으로 월·일·요일을 쓴다', () => {
    expect(formatKoreanDate(new Date('2026-11-27T03:00:00Z'))).toBe('11월 27일 금요일');
  });

  it('UTC로는 전날이어도 한국 자정이 지났으면 다음 날로 쓴다', () => {
    expect(formatKoreanDate(new Date('2026-11-27T15:30:00Z'))).toBe('11월 28일 토요일');
  });
});
