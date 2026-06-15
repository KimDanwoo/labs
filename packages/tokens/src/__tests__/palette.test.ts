import { describe, expect, it } from 'vitest';
import { commonColors, themeColors } from '../palette';

const SCALES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

describe('themeColors', () => {
  it.each(Object.keys(themeColors) as (keyof typeof themeColors)[])('%s 색상에 50–900 스케일이 모두 있다', (name) => {
    const scale = themeColors[name];
    for (const step of SCALES) {
      expect(scale).toHaveProperty(String(step));
    }
  });

  it('팔레트 값은 모두 hex 포맷이다', () => {
    for (const scale of Object.values(themeColors)) {
      for (const value of Object.values(scale)) {
        expect(value).toMatch(HEX_RE);
      }
    }
  });

  it('gray / indigo / slate / sky / green / red / amber 7종이 정의돼 있다', () => {
    const expected = ['gray', 'indigo', 'slate', 'sky', 'green', 'red', 'amber'];
    for (const name of expected) {
      expect(themeColors).toHaveProperty(name);
    }
  });
});

describe('commonColors', () => {
  it('white와 black이 hex로 정의돼 있다', () => {
    expect(commonColors.white).toMatch(HEX_RE);
    expect(commonColors.black).toMatch(HEX_RE);
  });
});
