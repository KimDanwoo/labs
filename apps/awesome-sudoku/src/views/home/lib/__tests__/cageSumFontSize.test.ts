import { cageSumFontSize } from '@views/home/lib/cageSumFontSize';
import { describe, expect, it } from 'vitest';

describe('케이지 합 글자 크기', () => {
  it.each([
    [30, '10px'],
    [36, '10px'],
    [55, '11px'],
    [80, '12px'],
  ])('칸 %ipx → %s (10px 아래로 내려가지 않는다)', (cell, size) => {
    expect(cageSumFontSize(cell)).toBe(size);
  });
});
